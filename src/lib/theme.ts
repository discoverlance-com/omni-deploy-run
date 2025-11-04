import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { useThemeSession } from '@/lib/theme-session'
import { type Theme, themeSchema } from '@/utils/validation'

type ThemeResults = {
	theme: Theme
	systemTheme?: 'light' | 'dark'
}

export const getCurrentThemeServerFn = createServerFn({
	method: 'GET',
}).handler(async () => {
	const themeSession = await useThemeSession()
	const data = themeSession.data
	if (!data) {
		return { theme: 'system', systemTheme: undefined } as ThemeResults
	}

	// validate theme
	const { error, data: result } = themeSchema
		.pick({ theme: true, systemTheme: true })
		.safeParse({ theme: data.theme, systemTheme: data.systemTheme })

	if (error) {
		return { theme: 'system', systemTheme: undefined } as ThemeResults
	}

	return {
		theme: result.theme,
		systemTheme: result.systemTheme,
	} as ThemeResults
})

export const updateThemeServerFn = createServerFn({ method: 'POST' })
	.inputValidator(themeSchema)
	.handler(async ({ data }) => {
		const themeSession = await useThemeSession()
		await themeSession.update({
			theme: data.theme,
			systemTheme: data?.systemTheme,
		})

		if (data.redirectTo) {
			throw redirect({
				to: data.redirectTo,
			})
		}

		return 'Done'
	})
