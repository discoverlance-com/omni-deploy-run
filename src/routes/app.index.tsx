import { createFileRoute, Link } from '@tanstack/react-router'
import { FolderIcon, LinkIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { siteInfo } from '@/config/site'

export const Route = createFileRoute('/app/')({
	head: () => ({
		meta: [{ title: `Dashboard - ${siteInfo.title}` }],
	}),
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<h1 className="text-4xl font-bold">Dashboard</h1>
			<h2 className="text-muted-foreground uppercase font-medium">Overview</h2>

			<div className="bg-linear-to-br from-primary to-primary/70 p-6 mb-8">
				<h2 className="text-2xl font-bold text-white mb-2">
					Welcome to your Cloud Deployment Dashboard
				</h2>
				<p className="text-white max-w-3xl mb-6">
					This is your central hub for managing Cloud Run applications across
					all your projects. Connect your source code repositories, trigger
					deployments, and monitor your services with ease.
				</p>

				<div className="grid md:grid-cols-2 gap-6">
					{/* Step 1: Connections */}
					<div className="p-4 rounded-lg flex items-start space-x-4 bg-white">
						<div className="shrink-0 bg-primary p-3 rounded-full">
							<LinkIcon className="w-6 h-6 text-white" />
						</div>
						<div>
							<h3 className="font-semibold text-lg text-primary">
								1. Set Up Connections
							</h3>
							<p className="text-sm text-gray-600 mt-1 mb-3">
								Link your GitHub account to allow Cloud Build to access your
								repositories and automate deployments.
							</p>
							<Button variant="link" asChild className="pl-0">
								<Link to="/app/connections">Go to Connections &rarr;</Link>
							</Button>
						</div>
					</div>

					{/* Step 2: Projects */}
					<div className="bg-white p-4 rounded-lg flex items-start space-x-4">
						<div className="p-3 rounded-full bg-primary">
							<FolderIcon className="w-6 h-6 text-white" />
						</div>
						<div>
							<h3 className="font-semibold text-lg text-primary">
								2. Organize Applications
							</h3>
							<p className="text-sm text-gray-600 mt-1">
								Applications are organized within projects. Select a project
								from the sidebar list to view its details and deploy new
								applications.
							</p>
						</div>
					</div>
				</div>
			</div>
			<h2 className="text-muted-foreground uppercase font-medium">Metrics</h2>
			<div className="grid auto-rows-min gap-4 md:grid-cols-3">
				<div className="bg-secondary p-6 rounded-lg border">
					<h3 className="text-sm text-gray-700 font-medium  uppercase tracking-wider">
						Total Projects
					</h3>
					<p className={'mt-2 text-4xl text-blue-800 font-bold'}>24</p>
				</div>
				<div className="bg-secondary p-6 rounded-lg border">
					<h3 className="text-sm text-gray-700 font-medium  uppercase tracking-wider">
						Total Applications
					</h3>
					<p className={'mt-2 text-4xl text-blue-800 font-bold'}>9</p>
				</div>
				<div className="bg-secondary p-6 rounded-lg border">
					<h3 className="text-sm text-gray-700 font-medium  uppercase tracking-wider">
						Successful Builds
					</h3>
					<p className={'mt-2 text-4xl text-green-800 font-bold'}>9</p>
				</div>
				<div className="bg-secondary p-6 rounded-lg border">
					<h3 className="text-sm text-gray-700 font-medium  uppercase tracking-wider">
						Failed Builds
					</h3>
					<p className={'mt-2 text-4xl text-red-800 font-bold'}>9</p>
				</div>
			</div>
			<div className="bg-secondary p-6 rounded-lg border">
				<h2 className="text-xl font-semibold text-gray-700 mb-4">
					Recent Build Status
				</h2>
				<BuildsChart />
			</div>
		</div>
	)
}

const sampleBuilds = [
	{
		id: 'b-1',
		appId: 'app-1',
		status: 'Success',
		timestamp: '2023-10-27T10:00:00Z',
	},
	{
		id: 'b-2',
		appId: 'app-2',
		status: 'Success',
		timestamp: '2023-10-26T15:30:00Z',
	},
	{
		id: 'b-3',
		appId: 'app-3',
		status: 'Failed',
		timestamp: '2023-10-25T11:00:00Z',
	},
	{
		id: 'b-4',
		appId: 'app-4',
		status: 'Success',
		timestamp: '2023-10-27T12:00:00Z',
	},
	{
		id: 'b-5',
		appId: 'app-1',
		status: 'Success',
		timestamp: '2023-10-24T09:00:00Z',
	},
	{
		id: 'b-6',
		appId: 'app-2',
		status: 'Pending',
		timestamp: '2023-10-28T14:00:00Z',
	},
	{
		id: 'b-7',
		appId: 'app-1',
		status: 'Success',
		timestamp: '2023-10-23T09:00:00Z',
	},
	{
		id: 'b-8',
		appId: 'app-4',
		status: 'Success',
		timestamp: '2023-10-22T09:00:00Z',
	},
	{
		id: 'b-9',
		appId: 'app-3',
		status: 'Failed',
		timestamp: '2023-10-21T09:00:00Z',
	},
]
type Build = (typeof sampleBuilds)[number]

const BuildsChart = () => {
	const buildStats = sampleBuilds.reduce(
		(acc, build) => {
			acc[build.status] = (acc[build.status] || 0) + 1
			return acc
		},
		{ Success: 0, Failed: 0, Pending: 0 } as Record<Build['status'], number>,
	)

	const totalBuilds = sampleBuilds.length

	const successWidth =
		totalBuilds > 0 ? (buildStats.Success / totalBuilds) * 100 : 0
	const pendingWidth =
		totalBuilds > 0 ? (buildStats.Pending / totalBuilds) * 100 : 0
	const failedWidth =
		totalBuilds > 0 ? (buildStats.Failed / totalBuilds) * 100 : 0

	return (
		<div>
			<div className="flex w-full h-8 rounded-full overflow-hidden bg-white">
				<div
					className="bg-green-600"
					style={{ width: `${successWidth}%` }}
					title={`Success: ${buildStats.Success}`}
				/>
				<div
					className="bg-yellow-600"
					style={{ width: `${pendingWidth}%` }}
					title={`Pending: ${buildStats.Pending}`}
				/>
				<div
					className="bg-red-600"
					style={{ width: `${failedWidth}%` }}
					title={`Failed: ${buildStats.Failed}`}
				/>
			</div>
			<div className="flex justify-between text-sm mt-3 px-1 text-gray-600">
				<div className="flex items-center">
					<span className="w-3 h-3 rounded-full bg-green-600 mr-2" />
					<span>Success ({buildStats.Success})</span>
				</div>
				<div className="flex items-center">
					<span className="w-3 h-3 rounded-full bg-yellow-600 mr-2" />
					<span>Pending ({buildStats.Pending})</span>
				</div>
				<div className="flex items-center">
					<span className="w-3 h-3 rounded-full bg-red-600 mr-2" />
					<span>Failed ({buildStats.Failed})</span>
				</div>
			</div>
		</div>
	)
}
