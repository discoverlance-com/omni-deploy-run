import { z } from 'zod/v4'

export const onboardingFormSchema = z.object({
	email: z
		.email({ message: 'Email must be a valid email address' })
		.min(1, 'Email is required'),
	password: z
		.string()
		.min(12, 'Password must be at least 12 characters')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter'),

	name: z
		.string()
		.min(3, 'Name is required')
		.max(150, 'Name must not be more than 150 characters'),
})
