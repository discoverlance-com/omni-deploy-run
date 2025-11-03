import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod/v4'

import { siteInfo } from '@/config/site'
import { getProjects } from '@/database/projects'
import { CreateProjectForm } from './app/-components/create-project'
import { ListProjects } from './app/-components/list-projects'

const projectsSearchSchema = z.object({
	filter: z.string().optional().catch(''),
	sort: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute('/app/projects/')({
	validateSearch: projectsSearchSchema,
	head: () => ({
		meta: [{ title: `Projects - ${siteInfo.title}` }],
	}),
	async loader() {
		return {
			projects: await getProjects(),
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<h1 className="text-4xl font-bold">Projects</h1>
			<div className="flex justify-between gap-8 items-center flex-wrap">
				<h2 className="text-muted-foreground -mt-2 uppercase font-medium text-sm">
					List of all projects
				</h2>
				<CreateProjectForm />
			</div>

			<ListProjects />
		</div>
	)
}
