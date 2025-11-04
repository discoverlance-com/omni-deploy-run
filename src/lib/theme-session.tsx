import { useSession } from '@tanstack/react-start/server'

import { env } from '@/env'
import type { Theme } from '@/utils/validation'

type ThemeSessionData = {
	theme: Theme
	systemTheme?: 'light' | 'dark'
}

const THEME_COOKIE_NAME = 'omni_deploy_run_theme'

export function useThemeSession() {
	return useSession<ThemeSessionData>({
		name: THEME_COOKIE_NAME,
		password: env.BETTER_AUTH_SECRET,
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			httpOnly: true,
		},
	})
}
