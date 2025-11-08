import type { AnyFormApi } from '@tanstack/react-form'
import { toast } from 'sonner'
import { z } from 'zod/v4'
import type { $ZodIssue } from 'zod/v4/core'

import { SUPPORTED_CLOUD_BUILD_LOCATIONS } from './cloud-build-locations'

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

export const applicationSchema = z.object({
	id: z.string().optional(),
	name: z
		.string('Application name must be text')
		.min(1, 'Application name is required')
		.max(100, 'Application name must not be more than 100 characters'),
	description: z.string('Application description must be text').optional(),
	tags: z
		.array(z.string().min(1, 'Tag is required'))
		.min(1, 'You must add at least 1 tag')
		.max(5, 'You cannot add more than 5 tags'),
	last_deployment_status: z.enum(['successful', 'pending', 'failed']),
	repository: z.string().min(1, 'Repository is required'),
	connection_id: z.string().min(1, 'Connection ID is required'),
	url: z.url().optional(),
	last_deployed_at: z.date().optional(),
	updated_at: z.date(),
	created_at: z.date(),
})

export type Application = z.Infer<typeof applicationSchema>

export const connectionSchema = z.object({
	id: z.string().optional(),
	name: z.string().optional(), // Full resource name from Cloud Build API
	displayName: z
		.string('Connection name must be text')
		.min(1, 'Connection name is required')
		.max(20, 'Connection name must not be more than 20 characters')
		.regex(
			/^[a-zA-Z\s_-]+$/,
			'Connection name must only contain letters, spaces, underscores, and hyphens',
		),
	type: z.enum(['github'], 'Connection type should be github'),
	location: z.enum(
		SUPPORTED_CLOUD_BUILD_LOCATIONS.map((location) => location.value),
		'Location not supported',
	),
	createTime: z.date().optional(),
	updateTime: z.date().optional(),
	reconciling: z.boolean().optional(),
	installationState: z
		.object({
			stage: z.string(),
			message: z.string().optional(),
			actionUri: z.string().optional(),
		})
		.optional(),
	disabled: z.boolean().optional(),
})

export type Connection = z.Infer<typeof connectionSchema>

export const userSettingsSchema = z.object({
	selected_connection_location: z.enum(
		SUPPORTED_CLOUD_BUILD_LOCATIONS.map((location) => location.value),
		'Location not supported',
	),
	updated_at: z.date(),
	created_at: z.date(),
})

export type UserSettings = z.Infer<typeof userSettingsSchema>

export const themeSchema = z.object({
	redirectTo: z
		.string()
		.optional()
		.refine(
			(val) => {
				if (val) {
					return val.startsWith('/app')
				}
				return true
			},
			{
				error: 'Invalid redirect url',
			},
		),
	theme: z.enum(['light', 'dark', 'system']),
	systemTheme: z.enum(['light', 'dark']).optional(),
})
export type Theme = z.Infer<typeof themeSchema>['theme']

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
