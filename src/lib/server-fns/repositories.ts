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
			// Check if error code is 2 (NOT_FOUND)
			const errorCode = (error as { code?: number })?.code

			if (errorCode === 2) {
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
		>[] = [{}]

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
