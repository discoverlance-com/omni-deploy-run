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

export const requireAuthentedUserMiddleware = createMiddleware({
	type: 'request',
})
	.middleware([sessionMiddleware])
	.server(({ next, context }) => {
		if (!context.session) {
			throw redirect({ to: '/' })
		}

		return next({ context: { session: context.session } })
	})

export const requireAnonymousUserMiddleware = createMiddleware({
	type: 'request',
})
	.middleware([sessionMiddleware])
	.server(async ({ next, context }) => {
		if (context.session) {
			throw redirect({ to: '/app' })
		}

		return next()
	})

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
