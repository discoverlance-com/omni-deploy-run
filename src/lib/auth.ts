import { betterAuth } from 'better-auth'
import { admin, lastLoginMethod } from 'better-auth/plugins'
import { passkey } from 'better-auth/plugins/passkey'

import { siteInfo } from '@/config/site'
import { env } from '@/env'
import { authAdapter } from './firestore-adapter'

export const auth = betterAuth({
	database: authAdapter,
	plugins: [
		passkey({
			rpName: siteInfo.title,
			origin: env.BETTER_AUTH_URL,
			authenticatorSelection: {
				userVerification: 'required',
				residentKey: 'preferred',
			},
		}),
		lastLoginMethod({}),
		admin(),
	],
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 12,
		autoSignIn: false,
	},
	account: {
		accountLinking: {
			enabled: true,
			allowDifferentEmails: false,
		},
	},
	rateLimit: {
		storage: 'database',
		modelName: 'rateLimit',
		enabled: true,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
		freshAge: 60 * 30, // 30 minutes (the session is fresh if created within the last 30 minutes)
		cookieCache: {
			enabled: true,
			maxAge: 15 * 60, // Cache duration in seconds
		},
	},
})
