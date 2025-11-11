import { createFileRoute, Link, notFound, Outlet } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
	CalendarIcon,
	ExternalLinkIcon,
	GitBranchIcon,
	PlayIcon,
	SettingsIcon,
} from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { ApplicationSettingsDialog } from '@/components/application-settings-dialog'
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { siteInfo } from '@/config/site'
import {
	addBuildToApplication,
	getApplicationById,
} from '@/database/applications'
import { runCloudBuildTriggerServerFn } from '@/lib/server-fns/cloud-build'

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
	const [isPending, startTransition] = useTransition()
	const navigate = Route.useNavigate()

	const triggerBuild = useServerFn(runCloudBuildTriggerServerFn)
	const addBuildInfo = useServerFn(addBuildToApplication)

	const handleNewBuild = async () => {
		if (!application.trigger_details) {
			toast.error('No build trigger configured for this application')
			return
		}

		startTransition(async () => {
			try {
				const result = await triggerBuild({
					data: {
						triggerName: application.trigger_details?.name ?? '',
						location: application.region,
						triggerId: application.trigger_details?.id ?? '',
						branchName: application.git_branch,
					},
				})

				if (result.buildId) {
					// Save build information to application
					try {
						await addBuildInfo({
							data: {
								applicationId: application.id,
								buildInfo: {
									id: result.buildId,
									timestamp: new Date().toISOString(),
								},
							},
						})

						toast.success(
							`Build triggered successfully! Build ID: ${result.buildId}`,
						)

						await navigate({
							to: '/app/applications/$applicationId/builds/$buildId/logs',
							params: {
								buildId: result.buildId || '',
							},
						})
						return
					} catch (saveError) {
						console.error('Failed to save build info:', saveError)
						// Don't throw here - build was triggered successfully
					}

					toast.success(
						`Build triggered successfully! Build ID: ${result.buildId}`,
					)
				} else {
					toast.success('Build triggered successfully!')
				}

				await navigate({
					to: '.',
				})
			} catch (error) {
				console.error('Build trigger error:', error)
				toast.error(
					error instanceof Error
						? `Failed to trigger build: ${error.message}`
						: 'Failed to trigger build. Please try again.',
				)
			}
		})
	}

	return (
		<div className="flex flex-1 flex-col gap-6 p-4">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Link
						to="/app/applications/$applicationId"
						params={{
							applicationId: application.id,
						}}
					>
						<h1 className="text-4xl font-bold">{application.name}</h1>
					</Link>
					<p className="text-muted-foreground mt-1">
						Application deployed on {application.region}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={handleNewBuild}
						disabled={isPending || !application.trigger_details}
					>
						<PlayIcon size={16} />
						{isPending ? 'Triggering...' : 'Manually Trigger Build'}
					</Button>
					<ApplicationSettingsDialog
						trigger={
							<Button variant="outline">
								<SettingsIcon size={16} />
								Settings
							</Button>
						}
						application={application}
					/>
				</div>
			</div>

			{/* Application Overview */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* <Card>
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
				</Card> */}

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<GitBranchIcon size={18} />
							Repository
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2 text-sm">
							<Tooltip>
								<TooltipTrigger>
									<p className="truncate font-mono">
										{application.repository.substring(0, 30)}...
									</p>
								</TooltipTrigger>
								<TooltipContent>
									<p className="font-mono">{application.repository}</p>
								</TooltipContent>
							</Tooltip>
							<p className="text-muted-foreground">
								Branch: {application.git_branch}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* <Card>
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
				</Card> */}

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
						{application.cloud_build_info &&
						application.cloud_build_info.length > 0 ? (
							<ScrollArea className="space-y-3 h-96">
								<ScrollBar orientation="horizontal" />
								{application.cloud_build_info
									.sort(
										(a, b) =>
											new Date(b.timestamp).getTime() -
											new Date(a.timestamp).getTime(),
									)
									.map((build) => (
										<Link
											key={build.id}
											to="/app/applications/$applicationId/builds/$buildId/logs"
											params={{
												applicationId: application.id,
												buildId: build.id,
											}}
											className="block w-full text-left p-3 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
														Build
													</Badge>
													<span className="font-mono text-sm">{build.id}</span>
												</div>
												<ExternalLinkIcon
													size={14}
													className="text-muted-foreground"
												/>
											</div>
											<p className="text-sm text-muted-foreground mt-1">
												View logs for this build
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												{new Date(build.timestamp).toLocaleString()}
											</p>
										</Link>
									))}
							</ScrollArea>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								<CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
								<p className="text-sm font-medium">No build history</p>
								<p className="text-xs">
									Builds will appear here once you trigger your first deployment
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Outlet />
			</div>
		</div>
	)
}
