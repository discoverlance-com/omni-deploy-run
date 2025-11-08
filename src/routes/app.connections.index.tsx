import { createFileRoute, Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { siteInfo } from '@/config/site'
import { getAllConnectionsServerFn } from '@/lib/server-fns/connections'

export const Route = createFileRoute('/app/connections/')({
	head: () => ({
		meta: [{ title: `Connections - ${siteInfo.title}` }],
	}),
	async loader() {
		// No location specified - will use user's settings default
		const response = await getAllConnectionsServerFn({ data: {} })
		return {
			connections: response.connections || [],
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { connections } = Route.useLoaderData()
	console.log({ connections })
	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<h1 className="text-4xl font-bold">Connections</h1>
			<div className="flex justify-between gap-8 items-center flex-wrap">
				<h2 className="text-muted-foreground -mt-2 uppercase font-medium text-sm">
					List of all git connections
				</h2>
				<Button asChild>
					<Link to="/app/connections/create">Setup new connection</Link>
				</Button>
			</div>

			<ListConnections />
		</div>
	)
}

function ListConnections() {
	return null
}
