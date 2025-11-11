import { createFileRoute } from '@tanstack/react-router'

import { requireAuthentedUserMiddleware } from '@/utils/auth'

export const Route = createFileRoute('/api/hello')({
	server: {
		middleware: [requireAuthentedUserMiddleware],
		handlers: {
			GET: async ({ request }) => {
				return new Response('Hello, World! from ' + request.url)
			},
			POST: async ({ request }) => {
				const body = await request.json()
				return new Response(`Hello, ${body.name}!`)
			},
		},
	},
})
