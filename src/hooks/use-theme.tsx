import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect } from 'react'

import { updateThemeServerFn } from '@/lib/theme'
import { THEME_QUERY_KEY, themeQueryOptions } from '@/utils/theme'

export const useTheme = () => {
	const updateTheme = useServerFn(updateThemeServerFn)
	const themeQuery = useSuspenseQuery(themeQueryOptions())
	const queryClient = useRouteContext({
		from: '__root__',
		select: (options) => options.queryClient,
	})

	const setTheme = async (...options: Parameters<typeof updateTheme>) => {
		await updateTheme(...options)
		await queryClient.invalidateQueries({ queryKey: THEME_QUERY_KEY })
	}

	// biome-ignore  lint/correctness/useExhaustiveDependencies: we can skip for the updateTheme function
	useEffect(() => {
		const theme = themeQuery.data.theme
		const root = window.document.documentElement

		root.classList.remove('light', 'dark')

		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
				.matches
				? 'dark'
				: 'light'

			updateTheme({ data: { theme: theme, systemTheme: systemTheme } })

			root.classList.add(systemTheme)
			return
		}

		root.classList.add(theme as string)
	}, [themeQuery.data.theme])

	return {
		theme: themeQuery.data.theme,
		systemTheme: themeQuery.data.systemTheme,
		setTheme,
	}
}
