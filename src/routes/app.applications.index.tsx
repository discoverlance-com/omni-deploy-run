import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod/v4'

import { Button } from '@/components/ui/button'
import { siteInfo } from '@/config/site'
import { getApplications } from '@/database/applications'

const projectsSearchSchema = z.object({
	filter: z.string().optional().catch(''),
	sort: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute('/app/applications/')({
	validateSearch: projectsSearchSchema,
	head: () => ({
		meta: [{ title: `Applications - ${siteInfo.title}` }],
	}),
	async loader() {
		return {
			applications: await getApplications(),
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<h1 className="text-4xl font-bold">Applications</h1>
			<div className="flex justify-between gap-8 items-center flex-wrap">
				<h2 className="text-muted-foreground -mt-2 uppercase font-medium text-sm">
					List of all applications
				</h2>
				<Button asChild>
					<Link to="/app/applications/create">Create Application</Link>
				</Button>
			</div>

			<ListApplications />
		</div>
	)
}

function ListApplications() {
	return null
}
