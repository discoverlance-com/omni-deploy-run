import { createFileRoute, notFound } from '@tanstack/react-router'
import {
	CalendarIcon,
	LoaderIcon,
	Maximize,
	Minimize,
	RefreshCw,
	WifiOffIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { DashboardNotFound } from '@/components/layout/not-found'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardHeading,
	CardTitle,
	CardToolbar,
} from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { siteInfo } from '@/config/site'
import { useLogStream } from '@/hooks/use-log-stream'
import { getBuildServerFn } from '@/lib/server-fns/cloud-build'

export const Route = createFileRoute(
	'/app/applications/$applicationId/builds/$buildId/logs',
)({
	head: () => ({
		meta: [{ title: `Application Build logs - ${siteInfo.title}` }],
	}),
	component: RouteComponent,
	async loader({ params, parentMatchPromise }) {
		const { buildId, applicationId } = params

		const parent = (await parentMatchPromise).loaderData

		try {
			const build = await getBuildServerFn({
				data: { buildId, location: parent?.application.region ?? '' },
			})

			if (!build) {
				throw notFound()
			}

			return { build, buildId, applicationId }
		} catch (error) {
			console.error('Error loading build:', error)
			throw notFound()
		}
	},
	notFoundComponent: () => {
		return <DashboardNotFound message="Application Build not found" />
	},
})

function RouteComponent() {
	const { build, buildId, applicationId } = Route.useLoaderData()
	const { logs, connectionState, error, refresh } = useLogStream(
		applicationId,
		buildId,
	)
	const [isFullscreen, setIsFullscreen] = useState(false)

	// Handle escape key to exit fullscreen
	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isFullscreen) {
				setIsFullscreen(false)
			}
		}

		document.addEventListener('keydown', handleEscapeKey)
		return () => document.removeEventListener('keydown', handleEscapeKey)
	}, [isFullscreen])

	const toggleFullscreen = () => {
		setIsFullscreen(!isFullscreen)
	}

	const getLevelColor = (severity: string) => {
		switch (severity) {
			case 'ERROR':
				return 'text-red-600'
			case 'WARNING':
				return 'text-yellow-600'
			case 'INFO':
				return 'text-blue-600'
			case 'DEBUG':
				return 'text-gray-500'
			default:
				return 'text-gray-600'
		}
	}

	const getConnectionStatusMessage = () => {
		switch (connectionState) {
			case 'connecting':
				return 'Connecting to log stream...'
			case 'connected':
				return 'Connected to log stream'
			case 'disconnected':
				return 'Log stream completed'
			case 'error':
				return error || 'Connection error - please try refreshing the page'
			default:
				return 'Unknown status'
		}
	}

	const getConnectionIcon = () => {
		switch (connectionState) {
			case 'connecting':
				return <LoaderIcon size={16} className="animate-spin" />
			case 'connected':
				return (
					<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
				)
			case 'error':
				return <WifiOffIcon size={16} className="text-red-500" />
			default:
				return <div className="w-2 h-2 bg-gray-500 rounded-full" />
		}
	}

	// Filter logs to only show actual log entries (not connection/status messages)
	const logEntries = logs.filter((log) => log.type === 'log')

	return (
		<>
			{isFullscreen && (
				<div className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300" />
			)}
			<Card
				className={`transition-all duration-300 ${
					isFullscreen
						? 'fixed inset-5 z-50 rounded-lg shadow-2xl flex flex-col'
						: ''
				}`}
			>
				<CardHeader>
					<CardHeading>
						<CardTitle>Build Logs</CardTitle>
						<CardDescription>
							{build?.name ? `Logs for build ${buildId}` : `Build ${buildId}`}
							<div className="text-xs text-muted-foreground mt-1">
								{getConnectionStatusMessage()}
							</div>
						</CardDescription>
					</CardHeading>

					<CardToolbar className="flex items-center gap-2">
						{getConnectionIcon()}
						<button
							type="button"
							onClick={refresh}
							className="p-1 hover:bg-gray-100 rounded transition-colors"
							title="Refresh logs"
							disabled={connectionState === 'connecting'}
						>
							<RefreshCw
								size={16}
								className={`text-gray-600 ${
									connectionState === 'connecting' ? 'animate-spin' : ''
								}`}
							/>
						</button>
						<button
							type="button"
							onClick={toggleFullscreen}
							className="p-1 hover:bg-gray-100 rounded transition-colors"
							title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
						>
							{isFullscreen ? (
								<Minimize size={16} className="text-gray-600" />
							) : (
								<Maximize size={16} className="text-gray-600" />
							)}
						</button>
					</CardToolbar>
				</CardHeader>
				<CardContent className={isFullscreen ? 'flex-1 overflow-hidden' : ''}>
					{logEntries.length > 0 ? (
						<ScrollArea
							className={`bg-black text-green-400 p-4 rounded-md font-mono text-sm transition-all duration-300 ${
								isFullscreen ? 'h-[calc(100vh-12rem)]' : 'h-96'
							}`}
						>
							<ScrollBar orientation="horizontal" />
							{logEntries.map((log, index) => (
								<div
									key={`${log.insertId}-${log.timestamp}-${index}`}
									className="flex gap-2 mb-1"
								>
									<span className="text-gray-500 text-xs">
										{new Date(log.timestamp).toLocaleTimeString()}
									</span>
									<span
										className={`font-semibold ${getLevelColor(log.severity || 'INFO')}`}
									>
										[{log.severity || 'INFO'}]
									</span>
									<span className="flex-1">{log.message}</span>
								</div>
							))}
							{connectionState === 'connecting' && (
								<div className="text-yellow-400 mt-2">Loading logs...</div>
							)}
						</ScrollArea>
					) : (
						<div
							className={`text-center py-8 text-muted-foreground ${
								isFullscreen
									? 'h-[calc(100vh-12rem)] flex flex-col items-center justify-center'
									: ''
							}`}
						>
							<CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
							{connectionState === 'connecting' ? (
								<div className="flex items-center justify-center gap-2">
									<LoaderIcon size={16} className="animate-spin" />
									<p>Loading build logs...</p>
								</div>
							) : connectionState === 'error' ? (
								<div className="text-red-500">
									<WifiOffIcon size={48} className="mx-auto mb-4 opacity-50" />
									<p className="mb-2">Error loading logs: {error}</p>
									<button
										type="button"
										onClick={() => window.location.reload()}
										className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
									>
										Retry
									</button>
								</div>
							) : (
								<p>No logs available for this build</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</>
	)
}
