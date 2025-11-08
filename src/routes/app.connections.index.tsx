import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod/v4'

import { Button } from '@/components/ui/button'
import { siteInfo } from '@/config/site'
import { getUserSettings } from '@/database/user-settings'
import { SUPPORTED_CLOUD_BUILD_LOCATIONS } from '@/utils/cloud-build-locations'
import ListConnections from './app/connections/-components/list-connections'
import { connectionQueryOptions } from './app/connections/-data/query-options'

const searchParamsSchema = z.object({
	location: z
		.enum(SUPPORTED_CLOUD_BUILD_LOCATIONS.map((loc) => loc.value))
		.optional()
		.catch(''),
})

export const Route = createFileRoute('/app/connections/')({
	head: () => ({
		meta: [{ title: `Connections - ${siteInfo.title}` }],
	}),
	validateSearch: searchParamsSchema,
	loaderDeps: ({ search: { location } }) => ({ location }),
	async loader({ context, deps: { location } }) {
		if (!location) {
			const settings = await getUserSettings()
			location = settings.selected_connection_location
		}
		await context.queryClient.ensureQueryData(connectionQueryOptions(location))

		return {
			locationUsed: location,
		}
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
