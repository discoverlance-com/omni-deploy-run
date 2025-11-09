import type { google as GoogleProtos } from '@google-cloud/cloudbuild/build/protos/protos'
import { createServerFn } from '@tanstack/react-start'

import {
	createConnection as createConnectionInDb,
	deleteConnection as deleteConnectionFromDb,
	getAllConnections as getAllConnectionsFromDb,
	getConnectionByConnectionId,
	updateConnection as updateConnectionInDb,
	updateConnectionsBatch,
} from '@/database/connections'
import { updateUserSettings } from '@/database/user-settings'
import { repositoryManagerClient } from '@/services/cloud-build'
import { requireAuthentedUserMiddleware } from '@/utils/auth'
import type { Connection } from '@/utils/validation'
import { connectionSchema } from '@/utils/validation'
import { slugify } from '../utils'

const getConnectionId = (name: string) => {
	return `omni-deploy-run-${slugify(name)}`
}

export const createGithubConnectionServerFn = createServerFn()
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(
		connectionSchema.pick({
			displayName: true,
			location: true,
			type: true,
		}),
	)
	.handler(async ({ data }) => {
		//validate type
		if (data.type !== 'github') {
			throw new Error('Only github connections are supported')
		}

		const projectId = await repositoryManagerClient.getProjectId()

		const parent = `projects/${projectId}/locations/${data.location}`
		const connectionId = getConnectionId(data.displayName)

		const request: GoogleProtos.devtools.cloudbuild.v2.ICreateConnectionRequest =
			{
				parent,
				connectionId,
				connection: { name: data.displayName, githubConfig: {} },
			}

		try {
			const [operation] =
				await repositoryManagerClient.createConnection(request)

			const [response] = await operation.promise()

			// Save connection to Firestore with initial pending status
			await createConnectionInDb({
				data: {
					name: response.name || '',
					displayName: data.displayName,
					type: data.type,
					location: data.location,
					connectionId,
					status: 'pending',
					...(response.createTime?.seconds && {
						createTime: new Date(Number(response.createTime.seconds) * 1000),
					}),
					...(response.updateTime?.seconds && {
						updateTime: new Date(Number(response.updateTime.seconds) * 1000),
					}),
					reconciling: response.reconciling || false,
					installationState: response.installationState
						? {
								stage: String(response.installationState.stage) || 'UNKNOWN',
								message: response.installationState.message || undefined,
								actionUri: response.installationState.actionUri || undefined,
							}
						: undefined,
					disabled: response.disabled || false,
				},
			}) // Update user settings with the new connection location
			await updateUserSettings({
				data: { selected_connection_location: data.location },
			})

			return { installationState: response.installationState }
		} catch (error) {
			// Check if error code is 6 (ALREADY_EXISTS)
			const errorCode = (error as { code?: number })?.code
			if (errorCode === 6) {
				// Connection already exists, fetch its installation state
				const name = `projects/${projectId}/locations/${data.location}/connections/${connectionId}`

				try {
					const [connection] = await repositoryManagerClient.getConnection({
						name,
					})

					// Save/update connection in Firestore
					await createConnectionInDb({
						data: {
							name: connection.name || '',
							displayName: data.displayName,
							type: data.type,
							location: data.location,
							connectionId,
							status:
								connection.installationState?.stage === 'COMPLETE'
									? 'active'
									: 'pending',
							...(connection.createTime?.seconds && {
								createTime: new Date(
									Number(connection.createTime.seconds) * 1000,
								),
							}),
							...(connection.updateTime?.seconds && {
								updateTime: new Date(
									Number(connection.updateTime.seconds) * 1000,
								),
							}),
							reconciling: connection.reconciling || false,
							installationState: connection.installationState
								? {
										stage:
											String(connection.installationState.stage) || 'UNKNOWN',
										message: connection.installationState.message || undefined,
										actionUri:
											connection.installationState.actionUri || undefined,
									}
								: undefined,
							disabled: connection.disabled || false,
						},
					})

					return { installationState: connection.installationState }
				} catch (getError) {
					throw new Error(
						`Connection already exists but failed to fetch details: ${(getError as { message?: string })?.message}`,
					)
				}
			}

			throw new Error(
				`Failed to create connection: ${(error as { message?: string })?.message}`,
			)
		}
	})

export const verifyGithubConnectionServerFn = createServerFn()
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(
		connectionSchema.pick({
			displayName: true,
			location: true,
			type: true,
		}),
	)
	.handler(async ({ data }) => {
		if (data.type !== 'github') {
			throw new Error('Only github connections are supported')
		}

		const connectionId = getConnectionId(data.displayName)

		const projectId = await repositoryManagerClient.getProjectId()

		const name = `projects/${projectId}/locations/${data.location}/connections/${connectionId}`

		try {
			const [connection] = await repositoryManagerClient.getConnection({ name })

			let status: 'pending' | 'active' | 'error' | 'action_required' = 'pending'
			let message = 'Connection status is unknown.'

			if (connection.reconciling) {
				status = 'pending'
				message = 'Connection is being finalized by Google Cloud.'
			} else if (connection.installationState?.stage === 'COMPLETE') {
				status = 'active'
				message = 'Connection is active and ready to use.'
			} else {
				status = 'action_required'
				message =
					'Connection is waiting for user to complete authorization on GitHub.'
			}

			// Update Firestore with the latest connection details
			const now = new Date()
			await updateConnectionInDb({
				data: {
					connectionId,
					name: connection.name || '',
					displayName: data.displayName,
					type: data.type,
					location: data.location,
					status,
					...(connection.createTime?.seconds && {
						createTime: new Date(Number(connection.createTime.seconds) * 1000),
					}),
					...(connection.updateTime?.seconds && {
						updateTime: new Date(Number(connection.updateTime.seconds) * 1000),
					}),
					reconciling: connection.reconciling || false,
					installationState: connection.installationState
						? {
								stage: String(connection.installationState.stage) || 'UNKNOWN',
								message: connection.installationState.message || undefined,
								actionUri: connection.installationState.actionUri || undefined,
							}
						: undefined,
					disabled: connection.disabled || false,
					githubConfig: connection.githubConfig
						? {
								authorizerCredential: connection.githubConfig
									.authorizerCredential
									? {
											oauthTokenSecretVersion:
												connection.githubConfig.authorizerCredential
													.oauthTokenSecretVersion || undefined,
											username:
												connection.githubConfig.authorizerCredential.username ||
												undefined,
										}
									: undefined,
								appInstallationId:
									connection.githubConfig.appInstallationId
										?.toString()
										.toString() || undefined,
							}
						: undefined,
					username:
						connection.githubConfig?.authorizerCredential?.username ||
						undefined,
					updated_at: now,
				},
			})

			return {
				status: status,
				message: message,
				reconciling: connection.reconciling,
				githubAppStage: connection.installationState?.stage,
				installationState: connection.installationState,
			}
		} catch (error) {
			throw new Error(
				`Failed to verify connection: ${(error as { message?: string })?.message}`,
			)
		}
	})

export const deleteGithubConnectionServerFn = createServerFn()
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(
		connectionSchema
			.pick({
				connectionId: true,
				type: true,
			})
			.required(),
	)
	.handler(async ({ data }) => {
		if (data.type !== 'github') {
			throw new Error('Only github connections are supported')
		}

		try {
			// Get connection details from Firestore to get the name for Cloud Build API
			const connection = await getConnectionByConnectionId({
				data: { connectionId: data.connectionId },
			})

			// Delete from Cloud Build API using the stored name
			if (connection.name) {
				const [operation] = await repositoryManagerClient.deleteConnection({
					name: connection.name,
				})

				await operation.promise()
			}

			// Delete from Firestore
			await deleteConnectionFromDb({ data: { connectionId: data.connectionId } })

			return { success: true, message: 'Connection deleted successfully' }
		} catch (error) {
			throw new Error(
				`Failed to delete connection: ${(error as { message?: string })?.message}`,
			)
		}
	})

export const getAllConnectionsServerFn = createServerFn()
	.middleware([requireAuthentedUserMiddleware])
	.handler(async () => {
		try {
			// Get all connections from Firestore
			const connections = await getAllConnectionsFromDb()

			return { connections }
		} catch (error) {
			console.error(error)
			throw new Error(
				`Failed to list connections: ${(error as { message?: string })?.message}`,
			)
		}
	})

/**
 * Sync connections from Google Cloud to Firestore
 * This fetches all connections from Cloud Build API and updates Firestore
 */
export const syncConnectionsServerFn = createServerFn()
	.middleware([requireAuthentedUserMiddleware])
	.handler(async () => {
		const projectId = await repositoryManagerClient.getProjectId()

		try {
			// Get all connections from Firestore to know what to sync
			const existingConnections = await getAllConnectionsFromDb()

			// Group connections by location
			const connectionsByLocation = new Map<
				string,
				Array<{ connectionId: string; displayName: string }>
			>()

			for (const conn of existingConnections) {
				if (!connectionsByLocation.has(conn.location)) {
					connectionsByLocation.set(conn.location, [])
				}
				connectionsByLocation.get(conn.location)?.push({
					connectionId: conn.connectionId || '',
					displayName: conn.displayName,
				})
			}

			const updatedConnections: Connection[] = []

			// Fetch latest details from Cloud Build API for each location
			for (const [location, connections] of connectionsByLocation) {
				for (const { connectionId, displayName } of connections) {
					const name = `projects/${projectId}/locations/${location}/connections/${connectionId}`

					try {
						const [connection] = await repositoryManagerClient.getConnection({
							name,
						})

						// Determine connection type
						let type: 'github' | 'gitlab' | 'bitbucket' = 'github'
						if (connection.githubConfig) {
							type = 'github'
						} else if (connection.gitlabConfig) {
							type = 'gitlab'
						} else if (
							connection.bitbucketDataCenterConfig ||
							connection.bitbucketCloudConfig
						) {
							type = 'bitbucket'
						}

						// Determine status
						let status: 'pending' | 'active' | 'error' | 'action_required' =
							'pending'
						if (connection.reconciling) {
							status = 'pending'
						} else if (connection.installationState?.stage === 'COMPLETE') {
							status = 'active'
						} else if (connection.disabled) {
							status = 'error'
						} else {
							status = 'action_required'
						}

						// Extract username
						const username =
							connection.githubConfig?.authorizerCredential?.username ||
							connection.gitlabConfig?.authorizerCredential?.username ||
							connection.bitbucketDataCenterConfig?.authorizerCredential
								?.username ||
							connection.bitbucketCloudConfig?.authorizerCredential?.username ||
							undefined

						const now = new Date()

						updatedConnections.push({
							connectionId,
							name: connection.name || '',
							displayName,
							type,
							location,
							status,
							...(connection.createTime?.seconds && {
								createTime: new Date(
									Number(connection.createTime.seconds) * 1000,
								),
							}),
							...(connection.updateTime?.seconds && {
								updateTime: new Date(
									Number(connection.updateTime.seconds) * 1000,
								),
							}),
							reconciling: connection.reconciling || false,
							installationState: connection.installationState
								? {
										stage:
											String(connection.installationState.stage) || 'UNKNOWN',
										message: connection.installationState.message || undefined,
										actionUri:
											connection.installationState.actionUri || undefined,
									}
								: undefined,
							disabled: connection.disabled || false,
							username,
							githubConfig: connection.githubConfig
								? {
										authorizerCredential: connection.githubConfig
											.authorizerCredential
											? {
													oauthTokenSecretVersion:
														connection.githubConfig.authorizerCredential
															.oauthTokenSecretVersion || undefined,
													username:
														connection.githubConfig.authorizerCredential
															.username || undefined,
												}
											: undefined,
										appInstallationId:
											connection.githubConfig.appInstallationId?.toString() ||
											undefined,
									}
								: undefined,
							gitlabConfig: connection.gitlabConfig
								? {
										authorizerCredential: connection.gitlabConfig
											.authorizerCredential
											? {
													userTokenSecretVersion:
														connection.gitlabConfig.authorizerCredential
															.userTokenSecretVersion || undefined,
													username:
														connection.gitlabConfig.authorizerCredential
															.username || undefined,
												}
											: undefined,
										hostUri: connection.gitlabConfig.hostUri || undefined,
										webhookSecretSecretVersion:
											connection.gitlabConfig.webhookSecretSecretVersion ||
											undefined,
									}
								: undefined,
							bitbucketConfig:
								connection.bitbucketDataCenterConfig ||
								connection.bitbucketCloudConfig
									? {
											authorizerCredential:
												connection.bitbucketDataCenterConfig
													?.authorizerCredential ||
												connection.bitbucketCloudConfig?.authorizerCredential
													? {
															userTokenSecretVersion:
																connection.bitbucketDataCenterConfig
																	?.authorizerCredential
																	?.userTokenSecretVersion ||
																connection.bitbucketCloudConfig
																	?.authorizerCredential
																	?.userTokenSecretVersion ||
																undefined,
															username:
																connection.bitbucketDataCenterConfig
																	?.authorizerCredential?.username ||
																connection.bitbucketCloudConfig
																	?.authorizerCredential?.username ||
																undefined,
														}
													: undefined,
											hostUri:
												connection.bitbucketDataCenterConfig?.hostUri ||
												undefined,
											webhookSecretSecretVersion:
												connection.bitbucketDataCenterConfig
													?.webhookSecretSecretVersion ||
												connection.bitbucketCloudConfig
													?.webhookSecretSecretVersion ||
												undefined,
											readAuthorizerCredential:
												connection.bitbucketDataCenterConfig
													?.readAuthorizerCredential ||
												connection.bitbucketCloudConfig
													?.readAuthorizerCredential
													? {
															userTokenSecretVersion:
																connection.bitbucketDataCenterConfig
																	?.readAuthorizerCredential
																	?.userTokenSecretVersion ||
																connection.bitbucketCloudConfig
																	?.readAuthorizerCredential
																	?.userTokenSecretVersion ||
																undefined,
															username:
																connection.bitbucketDataCenterConfig
																	?.readAuthorizerCredential?.username ||
																connection.bitbucketCloudConfig
																	?.readAuthorizerCredential?.username ||
																undefined,
														}
													: undefined,
										}
									: undefined,
							updated_at: now,
							created_at: now,
						})
					} catch (error) {
						console.error(`Failed to sync connection ${connectionId}:`, error)
						// Continue with other connections even if one fails
					}
				}
			}

			// Batch update all connections in Firestore
			if (updatedConnections.length > 0) {
				await updateConnectionsBatch({
					data: { connections: updatedConnections },
				})
			}

			return {
				success: true,
				synced: updatedConnections.length,
				message: `Successfully synced ${updatedConnections.length} connection(s)`,
			}
		} catch (error) {
			console.error(error)
			throw new Error(
				`Failed to sync connections: ${(error as { message?: string })?.message}`,
			)
		}
	})
