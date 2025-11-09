import { createFileRoute, Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { siteInfo } from '@/config/site'
import ListConnections from './app/connections/-components/list-connections'
import { connectionQueryOptions } from './app/connections/-data/query-options'

export const Route = createFileRoute('/app/connections/')({
	head: () => ({
		meta: [{ title: `Connections - ${siteInfo.title}` }],
	}),
	async loader({ context }) {
		await context.queryClient.ensureQueryData(connectionQueryOptions())
	},
	component: RouteComponent,
})

function RouteComponent() {
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

			<div>
				<div className="mt-4">
					<ListConnections />
				</div>
			</div>
		</div>
	)
}
