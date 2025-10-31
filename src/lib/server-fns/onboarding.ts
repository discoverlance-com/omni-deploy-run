import { createServerFn } from '@tanstack/react-start'

import { markAppSetupAsComplete } from '@/database/onboarding'
import { auth } from '@/lib/auth'
import { requireAnonymousUserMiddleware } from '@/utils/auth'
import { onboardingFormSchema } from '@/utils/validation'

export const handleUserOnboardingForm = createServerFn({
	method: 'POST',
})
	.middleware([requireAnonymousUserMiddleware])
	.inputValidator(onboardingFormSchema)
	.handler(async ({ data }) => {
		// try to first find user
		const internalAdapter = (await auth.$context).internalAdapter

		const user = await internalAdapter.findUserByEmail(data.email)

		if (!user) {
			const user = await internalAdapter.createUser({
				email: data.email,
				name: data.name,
				role: 'admin',
			})

			const passwordHasher = (await auth.$context).password
			const hashedPassword = await passwordHasher.hash(data.password)

			await internalAdapter.linkAccount({
				accountId: user.id,
				providerId: 'credential',
				password: hashedPassword,
				userId: user.id,
			})
		}
		// go ahead to update the onboarding status
		await markAppSetupAsComplete()
	})
