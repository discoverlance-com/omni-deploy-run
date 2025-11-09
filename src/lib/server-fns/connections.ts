import type { google as GoogleProtos } from '@google-cloud/cloudbuild/build/protos/protos'
import { createServerFn } from '@tanstack/react-start'

import { updateUserSettings } from '@/database/user-settings'
import { repositoryManagerClient } from '@/services/cloud-build'
import { requireAuthentedUserMiddleware } from '@/utils/auth'
import { type Connection, connectionSchema } from '@/utils/validation'
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

			// Update user settings with the new connection location
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

			let status = 'UNKNOWN'
			let message = 'Connection status is unknown.'

			if (connection.reconciling) {
				status = 'PENDING'
				message = 'Connection is being finalized by Google Cloud.'
			} else if (connection.installationState?.stage === 'COMPLETE') {
				status = 'ACTIVE'
				message = 'Connection is active and ready to use.'
			} else {
				status = 'PENDING_USER_ACTION'
				message =
					'Connection is waiting for user to complete authorization on GitHub.'
			}

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
		connectionSchema.pick({
			name: true,
			type: true,
			location: true,
			displayName: true,
		}),
	)
	.handler(async ({ data }) => {
		if (data.type !== 'github') {
			throw new Error('Only github connections are supported')
		}

		let name = data.name

		if (!name) {
			const connectionId = data.displayName
			const projectId = await repositoryManagerClient.getProjectId()

			name = `projects/${projectId}/locations/${data.location}/connections/${connectionId}`
		}

		try {
			const [operation] = await repositoryManagerClient.deleteConnection({
				name,
			})

			await operation.promise()

			return { success: true, message: 'Connection deleted successfully' }
		} catch (error) {
			throw new Error(
				`Failed to delete connection: ${(error as { message?: string })?.message}`,
			)
		}
	})

export const getAllConnectionsServerFn = createServerFn()
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(connectionSchema.pick({ location: true }).partial())
	.handler(async ({ data }) => {
		const projectId = await repositoryManagerClient.getProjectId()

		// Get location from input or fall back to user settings
		let location = data.location
		if (!location) {
			const { getUserSettings } = await import('@/database/user-settings')
			const settings = await getUserSettings()
			location = settings.selected_connection_location
		}

		const parent = `projects/${projectId}/locations/${location}`

		try {
			const connections: Array<
				Pick<
					Connection,
					| 'name'
					| 'displayName'
					| 'location'
					| 'type'
					| 'createTime'
					| 'updateTime'
					| 'reconciling'
					| 'installationState'
					| 'disabled'
					| 'username'
				>
			> = []

			// Use listConnectionsAsync to iterate through all connections
			const iterable = repositoryManagerClient.listConnectionsAsync({
				parent,
				pageSize: 100,
			})

			for await (const connection of iterable) {
				// Convert Firestore Timestamps to JS Dates
				const createTime = connection.createTime?.seconds
					? new Date(Number(connection.createTime.seconds) * 1000)
					: undefined

				const updateTime = connection.updateTime?.seconds
					? new Date(Number(connection.updateTime.seconds) * 1000)
					: undefined

				// Determine connection type based on which config is present
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

				// Extract username from authorizerCredential
				const username =
					connection.githubConfig?.authorizerCredential?.username ||
					connection.gitlabConfig?.authorizerCredential?.username ||
					connection.bitbucketDataCenterConfig?.authorizerCredential
						?.username ||
					connection.bitbucketCloudConfig?.authorizerCredential?.username ||
					undefined

				connections.push({
					name: connection.name || '',
					displayName:
						connection.name?.split('/').pop() ||
						connection.name?.split('/').slice(-1)[0] ||
						'',
					location: location || 'us-central1',
					type,
					createTime,
					updateTime,
					reconciling: connection.reconciling || false,
					installationState: connection.installationState
						? {
								stage: String(connection.installationState.stage) || 'UNKNOWN',
								message: connection.installationState.message || undefined,
								actionUri: connection.installationState.actionUri || undefined,
							}
						: undefined,
					disabled: connection.disabled || false,
					username,
				})
			}
			return { connections }
		} catch (error) {
			console.error(error)
			throw new Error(
				`Failed to list connections: ${(error as { message?: string })?.message}`,
			)
		}
	})
