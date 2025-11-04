import { queryOptions } from '@tanstack/react-query'

import { getCurrentThemeServerFn } from '@/lib/theme'

export const THEME_QUERY_KEY = ['current-theme']

export const themeQueryOptions = () =>
	queryOptions({
		queryKey: THEME_QUERY_KEY,
		queryFn: () => getCurrentThemeServerFn(),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	})
