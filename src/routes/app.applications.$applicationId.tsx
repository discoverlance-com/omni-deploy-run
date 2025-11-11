import { createFileRoute, notFound } from '@tanstack/react-router'
import {
	CalendarIcon,
	ClockIcon,
	ExternalLinkIcon,
	GitBranchIcon,
	PlayIcon,
	ServerIcon,
	SettingsIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { DashboardNotFound } from '@/components/layout/not-found'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { siteInfo } from '@/config/site'
import { getApplicationById } from '@/database/applications'

export const Route = createFileRoute('/app/applications/$applicationId')({
	head: () => ({
		meta: [{ title: `Application Details - ${siteInfo.title}` }],
	}),
	component: RouteComponent,
	async loader({ params }) {
		const { applicationId } = params

		try {
			const application = await getApplicationById({
				data: { id: applicationId },
			})
			if (!application) {
				throw notFound()
			}

			console.log({ application })
			return { application }
		} catch {
			throw notFound()
		}
	},
	notFoundComponent: () => {
		return <DashboardNotFound message="Application not found" />
	},
})

function RouteComponent() {
	const { application } = Route.useLoaderData()
	const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null)

	// Mock build data - will be replaced with real data later
	const mockBuilds = [
		{
			id: 'build-001',
			status: 'success' as const,
			createdAt: new Date('2024-11-11T10:30:00Z'),
			duration: '2m 45s',
			commitSha: 'a1b2c3d',
			commitMessage: 'Fix authentication bug',
		},
		{
			id: 'build-002',
			status: 'failed' as const,
			createdAt: new Date('2024-11-11T09:15:00Z'),
			duration: '1m 20s',
			commitSha: 'x9y8z7w',
			commitMessage: 'Add new features',
		},
		{
			id: 'build-003',
			status: 'success' as const,
			createdAt: new Date('2024-11-11T08:00:00Z'),
			duration: '3m 10s',
			commitSha: 'p4q5r6s',
			commitMessage: 'Update dependencies',
		},
	]

	// Mock logs data - will be replaced with Cloud Logging later
	const mockLogs = {
		'build-001': [
			{
				timestamp: '10:30:15',
				level: 'INFO',
				message: 'Starting build process...',
			},
			{
				timestamp: '10:30:16',
				level: 'INFO',
				message: 'Installing dependencies...',
			},
			{ timestamp: '10:31:45', level: 'INFO', message: 'Running tests...' },
			{
				timestamp: '10:32:30',
				level: 'INFO',
				message: 'Building application...',
			},
			{
				timestamp: '10:33:15',
				level: 'SUCCESS',
				message: 'Build completed successfully!',
			},
		],
		'build-002': [
			{
				timestamp: '09:15:10',
				level: 'INFO',
				message: 'Starting build process...',
			},
			{
				timestamp: '09:15:11',
				level: 'INFO',
				message: 'Installing dependencies...',
			},
			{
				timestamp: '09:16:20',
				level: 'ERROR',
				message: 'Test failed: authentication.test.js',
			},
			{
				timestamp: '09:16:21',
				level: 'ERROR',
				message: 'Build failed due to test failures',
			},
		],
		'build-003': [
			{
				timestamp: '08:00:05',
				level: 'INFO',
				message: 'Starting build process...',
			},
			{
				timestamp: '08:00:06',
				level: 'INFO',
				message: 'Installing dependencies...',
			},
			{
				timestamp: '08:01:15',
				level: 'INFO',
				message: 'Dependencies updated successfully',
			},
			{ timestamp: '08:02:45', level: 'INFO', message: 'Running tests...' },
			{ timestamp: '08:03:15', level: 'SUCCESS', message: 'All tests passed!' },
		],
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'successful':
			case 'success':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
			case 'failed':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
		}
	}

	const getLevelColor = (level: string) => {
		switch (level) {
			case 'ERROR':
				return 'text-red-600'
			case 'SUCCESS':
				return 'text-green-600'
			case 'WARN':
				return 'text-yellow-600'
			default:
				return 'text-gray-600'
		}
	}

	const handleNewBuild = () => {
		toast.success('Build triggered successfully!')
		// TODO: Implement actual build trigger
	}

	return (
		<div className="flex flex-1 flex-col gap-6 p-4">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-4xl font-bold">{application.name}</h1>
					<p className="text-muted-foreground mt-1">
						Application deployed on {application.region}
					</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={handleNewBuild}>
						<PlayIcon size={16} />
						Trigger Build
					</Button>
					<Button variant="outline">
						<SettingsIcon size={16} />
						Settings
					</Button>
				</div>
			</div>

			{/* Application Overview */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ServerIcon size={18} />
							Status
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge
							className={`text-sm ${getStatusColor(application.last_deployment_status)}`}
						>
							{application.last_deployment_status}
						</Badge>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<GitBranchIcon size={18} />
							Repository
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2 text-sm">
							<p className="truncate font-mono">{application.repository}</p>
							<p className="text-muted-foreground">
								Branch: {application.git_branch}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ClockIcon size={18} />
							Last Deploy
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm">
							{application.last_deployed_at
								? application.last_deployed_at.toLocaleDateString()
								: 'Never deployed'}
						</p>
					</CardContent>
				</Card>

				{application.url && (
					<Card className="md:col-span-2 lg:col-span-3">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ExternalLinkIcon size={18} />
								Live URL
							</CardTitle>
						</CardHeader>
						<CardContent>
							<a
								href={application.url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-blue-600 hover:underline font-mono"
							>
								{application.url}
								<ExternalLinkIcon size={14} />
							</a>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Configuration Details */}
			<Card>
				<CardHeader>
					<CardTitle>Configuration</CardTitle>
					<CardDescription>Current deployment configuration</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Port</p>
							<p className="text-lg font-mono">{application.port}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Memory
							</p>
							<p className="text-lg font-mono">{application.memory}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">CPU</p>
							<p className="text-lg font-mono">{application.number_of_cpus}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Public Access
							</p>
							<p className="text-lg">
								{application.allow_public_access ? 'Enabled' : 'Disabled'}
							</p>
						</div>
					</div>

					{application.tags && application.tags.length > 0 && (
						<>
							<Separator className="my-4" />
							<div>
								<p className="text-sm font-medium text-muted-foreground mb-2">
									Tags
								</p>
								<div className="flex flex-wrap gap-1">
									{application.tags.map((tag) => (
										<Badge key={tag} variant="secondary">
											{tag}
										</Badge>
									))}
								</div>
							</div>
						</>
					)}

					{application.environment_variables &&
						application.environment_variables.length > 0 && (
							<>
								<Separator className="my-4" />
								<div>
									<p className="text-sm font-medium text-muted-foreground mb-2">
										Environment Variables
									</p>
									<div className="space-y-1">
										{application.environment_variables.map((env) => (
											<div
												key={`${env.key}-${env.value}`}
												className="flex items-center gap-2 text-sm font-mono"
											>
												<span className="font-semibold">{env.key}:</span>
												<span
													className={
														env.is_secret ? 'text-muted-foreground' : ''
													}
												>
													{env.is_secret ? '••••••••' : env.value}
												</span>
												{env.is_secret && (
													<Badge variant="outline" className="text-xs">
														Secret
													</Badge>
												)}
											</div>
										))}
									</div>
								</div>
							</>
						)}
				</CardContent>
			</Card>

			{/* Build History */}
			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CalendarIcon size={18} />
							Build History
						</CardTitle>
						<CardDescription>Recent deployments and builds</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{mockBuilds.map((build) => (
								<button
									key={build.id}
									type="button"
									className={`w-full text-left p-3 rounded-lg border transition-colors ${
										selectedBuildId === build.id
											? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
											: 'hover:bg-gray-50 dark:hover:bg-gray-900'
									}`}
									onClick={() => setSelectedBuildId(build.id)}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge
												className={`text-xs ${getStatusColor(build.status)}`}
											>
												{build.status}
											</Badge>
											<span className="font-mono text-sm">{build.id}</span>
										</div>
										<span className="text-xs text-muted-foreground">
											{build.duration}
										</span>
									</div>
									<p className="text-sm text-muted-foreground mt-1 truncate">
										{build.commitMessage}
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										{build.createdAt.toLocaleString()}
									</p>
								</button>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Build Logs */}
				<Card>
					<CardHeader>
						<CardTitle>Build Logs</CardTitle>
						<CardDescription>
							{selectedBuildId
								? `Logs for ${selectedBuildId}`
								: 'Select a build to view logs'}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{selectedBuildId ? (
							<div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
								{mockLogs[selectedBuildId as keyof typeof mockLogs]?.map(
									(log) => (
										<div
											key={`${log.timestamp}-${log.message}`}
											className="flex gap-2 mb-1"
										>
											<span className="text-gray-500">{log.timestamp}</span>
											<span
												className={`font-semibold ${getLevelColor(log.level)}`}
											>
												[{log.level}]
											</span>
											<span>{log.message}</span>
										</div>
									),
								)}
							</div>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
								<p>Select a build from the history to view its logs</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
