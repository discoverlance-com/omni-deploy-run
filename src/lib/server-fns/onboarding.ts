import { createServerFn } from '@tanstack/react-start'

import { createArtifactRegistry } from '@/database/artifact-registry'
import { markAppSetupAsComplete } from '@/database/onboarding'
import { auth } from '@/lib/auth'
import { requireAnonymousUserMiddleware } from '@/utils/auth'
import { onboardingFormSchema } from '@/utils/validation'
import { createArtifactRegistryServerFn } from './artifact-registry'

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

		// create the artifact registry
		const registry = await createArtifactRegistryServerFn({
			data: { artifact_registry: data.artifact_registry },
		})

		if (registry) {
			// save
			await createArtifactRegistry({
				data: {
					name: data.artifact_registry ?? '',
					repositoryId: registry.name ?? '',
					uri: registry.uri ?? '',
					description: registry.description ?? '',
				},
			})
		}
		// go ahead to update the onboarding status
		await markAppSetupAsComplete()
	})
