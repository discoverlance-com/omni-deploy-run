import { createFileRoute } from '@tanstack/react-router'

import { getApplicationById } from '@/database/applications'
import { getBuildServerFn } from '@/lib/server-fns/cloud-build'
import { cloudLoggingClient } from '@/services/cloud-logging'
import { requireAuthentedUserMiddleware } from '@/utils/auth'

export const Route = createFileRoute(
	'/api/logs/$applicationId/builds/$buildId',
)({
	server: {
		middleware: [requireAuthentedUserMiddleware],
		handlers: {
			GET: async ({ params }) => {
				const { applicationId, buildId } = params
				const projectId = cloudLoggingClient.projectId

				try {
					// Get application
					const application = await getApplicationById({
						data: { id: applicationId },
					})

					if (!application) {
						return new Response(
							JSON.stringify({ error: 'Application not found' }),
							{
								status: 404,
								headers: { 'Content-Type': 'application/json' },
							},
						)
					}

					// Get build
					const build = await getBuildServerFn({
						data: { buildId, location: application.region },
					})

					if (!build) {
						return new Response(JSON.stringify({ error: 'Build not found' }), {
							status: 404,
							headers: { 'Content-Type': 'application/json' },
						})
					}

					// Create timestamp filter based on build creation time
					const filterTimestamp = build.createTime
						? build.createTime.toISOString()
						: application.created_at?.toISOString() ||
							new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // fallback to 24h ago

					// Create log filter
					const filter = [
						`log_name="projects/${projectId}/logs/cloudbuild"`,
						'resource.type="build"',
						`resource.labels.build_id="${buildId}"`,
						`timestamp>="${filterTimestamp}"`,
					].join(' AND ')

					// Create stream
					const stream = new ReadableStream({
						async start(controller) {
							try {
								// Send connection message
								controller.enqueue(
									`data: ${JSON.stringify({
										type: 'connection',
										message: `Connected to ${application.name} build logs`,
										timestamp: new Date().toISOString(),
									})}\n\n`,
								)

								// Get logs
								const [entries] = await cloudLoggingClient.getEntries({
									resourceNames: [`projects/${projectId}`],
									filter,
									orderBy: 'timestamp asc',
									pageSize: 1000,
								})

								// Send logs
								for (const entry of entries) {
									const logData = {
										type: 'log',
										timestamp:
											entry.metadata.timestamp instanceof Date
												? entry.metadata.timestamp.toISOString()
												: new Date().toISOString(),
										severity: entry.metadata.severity || 'INFO',
										message:
											entry.metadata.textPayload ||
											JSON.stringify(entry.metadata.jsonPayload) ||
											'No message',
										insertId: entry.metadata.insertId,
									}

									controller.enqueue(`data: ${JSON.stringify(logData)}\n\n`)
								}

								// Send completion
								controller.enqueue(
									`data: ${JSON.stringify({
										type: 'history_complete',
										message: `Loaded ${entries.length} log entries`,
										timestamp: new Date().toISOString(),
									})}\n\n`,
								)

								// Send end
								controller.enqueue(
									`data: ${JSON.stringify({
										type: 'stream_end',
										message: 'Log stream completed',
										timestamp: new Date().toISOString(),
									})}\n\n`,
								)

								controller.close()
							} catch (error) {
								controller.enqueue(
									`data: ${JSON.stringify({
										type: 'error',
										message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
										timestamp: new Date().toISOString(),
									})}\n\n`,
								)
								controller.close()
							}
						},
					})

					return new Response(stream, {
						headers: {
							'Content-Type': 'text/event-stream',
							'Cache-Control': 'no-cache',
							Connection: 'keep-alive',
						},
					})
				} catch (error) {
					return new Response(
						JSON.stringify({
							error: 'Failed to initialize log stream',
							details: error instanceof Error ? error.message : 'Unknown error',
						}),
						{
							status: 500,
							headers: { 'Content-Type': 'application/json' },
						},
					)
				}
			},
		},
	},
})
