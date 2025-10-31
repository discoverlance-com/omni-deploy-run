import { redirect } from '@tanstack/react-router'
import { createMiddleware, createServerFn } from '@tanstack/react-start'

import { auth } from '@/lib/auth'

export const sessionMiddleware = createMiddleware({ type: 'request' }).server(
	async ({ request, next }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		})

		return await next({ context: { session } })
	},
)

export const requireAuthentedUser = createServerFn()
	.middleware([sessionMiddleware])
	.handler(async ({ context }) => {
		if (!context.session) {
			throw redirect({ to: '/' })
		}

		return context.session
	})

export const requireAnonymousUser = createServerFn()
	.middleware([sessionMiddleware])
	.handler(async ({ context }) => {
		if (context.session) {
			throw redirect({ to: '/app' })
		}
	})
