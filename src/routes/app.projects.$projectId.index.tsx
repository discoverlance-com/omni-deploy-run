import { createFileRoute, notFound } from '@tanstack/react-router'

import { siteInfo } from '@/config/site'
import { getProjectById } from '@/database/projects'

export const Route = createFileRoute('/app/projects/$projectId/')({
	async loader({ params }) {
		const project = await getProjectById({ data: { id: params.projectId } })

		if (!project) {
			throw notFound()
		}

		return { project }
	},
	head: ({ loaderData }) => {
		return {
			meta: [{ title: `${loaderData?.project.name} - ${siteInfo.title}` }],
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<div className="grid auto-rows-min gap-4 md:grid-cols-3">
				<div className="bg-muted/50 aspect-video rounded-xl" />
				<div className="bg-muted/50 aspect-video rounded-xl" />
				<div className="bg-muted/50 aspect-video rounded-xl" />
			</div>
			<div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
		</div>
	)
}
