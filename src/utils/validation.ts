import type { AnyFormApi } from '@tanstack/react-form'
import { toast } from 'sonner'
import { z } from 'zod/v4'
import type { $ZodIssue } from 'zod/v4/core'

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

export const loginFormSchema = z.object({
	email: z
		.email({ message: 'Email must be a valid email address' })
		.min(1, 'Email is required'),
	password: z.string().min(1, 'Password is required'),
	rememberMe: z.boolean(),
})

export const projectSchema = z.object({
	id: z.string().optional(),
	name: z
		.string('Project name must be text')
		.min(1, 'Project name is required')
		.max(100, 'Project name must not be more than 100 characters'),
	description: z.string('Project description must be text').optional(),
	updated_at: z.date(),
	created_at: z.date(),
})

export type Project = z.Infer<typeof projectSchema>

export function maybeHandleFormZodError<T extends object>(
	error: unknown,
	formValues: T,
	formApi: AnyFormApi,
) {
	if (error && error instanceof Error && typeof error.message === 'string') {
		let issues: $ZodIssue[] = []

		try {
			const parsed = JSON.parse(error.message)
			if (Array.isArray(parsed)) {
				// Use parsed as the array
				issues = parsed
			}
		} catch {
			// Not a JSON array, ignore
		}

		console.log({ issues })
		for (const err of issues) {
			// we are dealing with zod error
			if (err?.path && err.message) {
				const fields = Object.keys(formValues)
				const key = err.path[0]?.toString()

				if (key && fields.includes(key)) {
					const formField = formApi.getFieldInfo(key).instance
					if (formField) {
						// set the error
						formField.setErrorMap({ onSubmit: { message: err.message } })

						// focus on the field
						const input = document.getElementById(
							formField.name,
						) as HTMLInputElement | null
						input?.focus()
					}
				} else {
					toast.error(err.message)
				}

				return { handled: true }
			}
		}
	}

	return { handled: false }
}
