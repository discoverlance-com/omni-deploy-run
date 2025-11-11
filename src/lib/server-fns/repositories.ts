import type { google as GoogleProtos } from '@google-cloud/cloudbuild/build/protos/protos'
import { createServerFn } from '@tanstack/react-start'
import z from 'zod/v4'

import { repositoryManagerClient } from '@/services/cloud-build'
import { requireAuthentedUserMiddleware } from '@/utils/auth'
import { connectionSchema } from '@/utils/validation'

function extractRepoName(githubUrl: string): string {
	// Remove .git extension if present
	const withoutGit = githubUrl.replace(/\.git$/, '')

	// Extract the last segment (repository name) from the URL
	const segments = withoutGit.split('/')
	const repoName = segments[segments.length - 1]

	return repoName.toLowerCase()
}

export const upsertRepositoryServerFn = createServerFn()
	.inputValidator(
		z.object({
			connectionId: z.string().min(1, 'Connection ID is required'),
			repository: z.object({
				remoteUri: z.string().min(1, 'Repository remote URI is required'),
			}),
		}),
	)
	.handler(async ({ data }) => {
		const request: GoogleProtos.devtools.cloudbuild.v2.IGetRepositoryRequest = {
			name: `${data.connectionId}/repositories/${extractRepoName(
				data.repository.remoteUri,
			)}`,
		}

		// Run request
		try {
			const [response] = await repositoryManagerClient.getRepository(request)
			return {
				name: response.name,
				remoteUri: response.remoteUri,
				createTime: response.createTime
					? new Date(Number(response.createTime.seconds) * 1000)
					: undefined,
				updateTime: response.updateTime
					? new Date(Number(response.updateTime.seconds) * 1000)
					: undefined,
			}
		} catch (error) {
			// Check if error code is 5 (NOT_FOUND)
			const errorCode = (error as { code?: number })?.code

			if (errorCode === 5) {
				const request: GoogleProtos.devtools.cloudbuild.v2.ICreateRepositoryRequest =
					{
						parent: data.connectionId,
						repository: {
							remoteUri: data.repository.remoteUri,
						},
						repositoryId: extractRepoName(data.repository.remoteUri),
					}
				// create repository
				const [operation] =
					await repositoryManagerClient.createRepository(request)
				const [response] = await operation.promise()

				return {
					name: response.name,
					remoteUri: response.remoteUri,
					createTime: response.createTime
						? new Date(Number(response.createTime.seconds) * 1000)
						: undefined,
					updateTime: response.updateTime
						? new Date(Number(response.updateTime.seconds) * 1000)
						: undefined,
				}
			}

			throw error
		}
	})

export const getAllLinkableRepositoriesServerFn = createServerFn({
	method: 'GET',
})
	.inputValidator(connectionSchema.pick({ connectionId: true }))
	.middleware([requireAuthentedUserMiddleware])
	.handler(async ({ data }) => {
		const request: GoogleProtos.devtools.cloudbuild.v2.IFetchLinkableRepositoriesRequest =
			{
				connection: data.connectionId,
				pageSize: 100,
			}

		const repositories: Pick<
			GoogleProtos.devtools.cloudbuild.v2.IRepository,
			'name' | 'remoteUri'
		>[] = []

		const iterable =
			repositoryManagerClient.fetchLinkableRepositoriesAsync(request)

		for await (const response of iterable) {
			repositories.push({
				name: response.name,
				remoteUri: response.remoteUri,
			})
		}

		return repositories
	})

export const listRepositoriesServerFn = createServerFn()
	.inputValidator(
		z.object({
			connectionId: z.string().min(1, 'Connection ID is required'),
		}),
	)
	.handler(async ({ data }) => {
		const request: GoogleProtos.devtools.cloudbuild.v2.IListRepositoriesRequest =
			{
				parent: data.connectionId,
				pageSize: 100,
			}

		const repositories: Pick<
			GoogleProtos.devtools.cloudbuild.v2.IRepository,
			'name' | 'remoteUri'
		>[] = []

		try {
			const iterable = repositoryManagerClient.listRepositoriesAsync(request)

			for await (const response of iterable) {
				repositories.push({
					name: response.name,
					remoteUri: response.remoteUri,
				})
			}

			return repositories
		} catch (error) {
			console.error('Error listing repositories:', error)
			// Return empty array if no repositories found or other error
			return []
		}
	})

export const deleteRepositoryServerFn = createServerFn()
	.inputValidator(
		z.object({
			repositoryName: z.string().min(1, 'Repository name is required'),
		}),
	)
	.handler(async ({ data }) => {
		try {
			const [operation] = await repositoryManagerClient.deleteRepository({
				name: data.repositoryName,
			})

			await operation.promise()

			return { success: true }
		} catch (error) {
			console.error('Error deleting repository:', error)
			throw new Error(
				`Failed to delete repository: ${(error as { message?: string })?.message}`,
			)
		}
	})

export const deleteAllRepositoriesForConnectionServerFn = createServerFn()
	.inputValidator(
		z.object({
			connectionId: z.string().min(1, 'Connection ID is required'),
		}),
	)
	.handler(async ({ data }) => {
		try {
			// First, list all repositories for this connection
			const repositories = await listRepositoriesServerFn({
				data: { connectionId: data.connectionId },
			})

			// Delete all repositories
			const deletePromises = repositories.map((repo) => {
				if (repo.name) {
					return deleteRepositoryServerFn({
						data: { repositoryName: repo.name },
					})
				}
				return Promise.resolve({ success: true })
			})

			await Promise.all(deletePromises)

			return {
				success: true,
				message: `Deleted ${repositories.length} repositories`,
				deletedCount: repositories.length,
			}
		} catch (error) {
			console.error('Error deleting all repositories for connection:', error)
			throw new Error(
				`Failed to delete repositories: ${(error as { message?: string })?.message}`,
			)
		}
	})
