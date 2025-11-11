import type { google as GoogleProtos } from '@google-cloud/cloudbuild/build/protos/protos'
import { createServerFn } from '@tanstack/react-start'
import z from 'zod/v4'

import { getAllArtifactRegistries } from '@/database/artifact-registry'
import { cloudBuildClient } from '@/services/cloud-build'
import { requireAuthentedUserMiddleware } from '@/utils/auth'
import { applicationSchema } from '@/utils/validation'
import { slugify } from '../utils'
import { upsertRepositoryServerFn } from './repositories'
import { getAppServiceAccountServerFn } from './service-accounts'

const cloudBuildTriggerSchema = z.object({
	location: z.string(),
	branch: z.string(),
	applicationName: z.string(),
	connectionId: z.string().min(1, 'Connection ID is required'),
	repository: z.object({
		remoteUri: z.string().min(1, 'Repository remote URI is required'),
	}),
})

function extractOwnerAndRepo(githubUri: string): {
	owner: string
	name: string
} {
	const cleanedUri = githubUri
		.replace(/^(https?:\/\/|git@)[\w.]+[:/]/, '')
		.replace(/\.git$/, '')

	// Splits path parts and takes the last two (owner/repo)
	// Example: discoverlance-com/react-router-starter
	const parts = cleanedUri.split('/')

	if (parts.length < 2) {
		// Use the last two elements for safety
		throw new Error('Invalid GitHub URI format. Expected owner/repo structure.')
	}

	const name = parts[parts.length - 1]
	const owner = parts[parts.length - 2]

	return { owner, name }
}

const getApplicationName = (name: string) => {
	return slugify(name)
}

export const createGithubCloudBuildTriggerServerFn = createServerFn({
	method: 'POST',
})
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(
		cloudBuildTriggerSchema.extend(
			applicationSchema.pick({
				port: true,
				memory: true,
				allow_public_access: true,
				number_of_cpus: true,
			}).shape,
		),
	)
	.handler(async ({ data }) => {
		const projectId = await cloudBuildClient.getProjectId()

		const name = getApplicationName(data.applicationName)
		const { name: repoName } = extractOwnerAndRepo(data.repository.remoteUri)

		const repository = await upsertRepositoryServerFn({
			data: {
				connectionId: data.connectionId,
				repository: {
					remoteUri: data.repository.remoteUri,
				},
			},
		})

		const artifactRegistries = await getAllArtifactRegistries()

		if (!artifactRegistries || artifactRegistries.length === 0) {
			// Fail fast if no artifact registry is configured.
			throw new Error('No Artifact Registry found in the project.')
		}

		const artifactRegistry = artifactRegistries[0] // For simplicity, use the first registry

		const branchRegex = `^${data.branch}$`
		const serviceAccount = await getAppServiceAccountServerFn()

		const request: GoogleProtos.devtools.cloudbuild.v1.ICreateBuildTriggerRequest =
			{
				parent: `projects/${projectId}/locations/${data.location}`,
				trigger: {
					serviceAccount: serviceAccount.fullName,
					name: `${name}-github-trigger`,
					description: `GitHub Trigger created via Omni Deploy Run for the repository ${repoName}`,
					repositoryEventConfig: {
						repositoryType: 'GITHUB',
						repository: repository.name,
						push: { branch: branchRegex },
					},
					build: {
						steps: [
							{
								name: 'gcr.io/cloud-builders/docker',
								args: [
									'build',
									'--no-cache',
									'-t',
									'$_AR_HOSTNAME/$PROJECT_ID/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA',
									'.',
									'-f',
									'Dockerfile',
								],
								id: 'Build',
							},
							{
								name: 'gcr.io/cloud-builders/docker',
								args: [
									'push',
									'$_AR_HOSTNAME/$PROJECT_ID/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA',
								],
								id: 'Push',
							},
							{
								name: 'gcr.io/google.com/cloudsdktool/cloud-sdk:slim',
								entrypoint: 'gcloud',
								args: [
									'run',
									'services',
									'update',
									'$_SERVICE_NAME',
									'--platform=managed',
									'--cpu=$_NUM_CPUS',
									'--memory=$_MEMORY',
									data.allow_public_access
										? '--ingress=all'
										: '--ingress=internal',
									'--port=$_PORT',
									// Pass the image argument
									'--image=$_AR_HOSTNAME/$PROJECT_ID/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA',
									// The long labels argument must be one continuous string in the array
									'--labels=managed-by=omni-deploy-run-build-deploy-cloud-run,commit-sha=$COMMIT_SHA,gcb-build-id=$BUILD_ID',
									'--region=$_DEPLOY_REGION',
									'--quiet',
								],
								id: 'Deploy',
							},
						],
						images: [
							'$_AR_HOSTNAME/$PROJECT_ID/$REPO_NAME/$_SERVICE_NAME:$COMMIT_SHA',
						],
						options: {
							substitutionOption: 'ALLOW_LOOSE',
							logging: 'CLOUD_LOGGING_ONLY',
						},
						substitutions: {
							_AR_HOSTNAME: artifactRegistry.name,
							_PLATFORM: 'managed',
							_SERVICE_NAME: name,
							_DEPLOY_REGION: data.location,
							_PORT: data.port.toString(),
							_MEMORY: data.memory,
							_NUM_CPUS: data.number_of_cpus.toString(),
						},
					},
				},
			}

		const [response] = await cloudBuildClient.createBuildTrigger(request)

		const triggerDetails = {
			name: response.name,
			applicationName: name,
			createTime: response.createTime
				? new Date(Number(response.createTime.seconds) * 1000)
				: undefined,
			repositoryEventConfig: {
				name: response.repositoryEventConfig?.repository || '',
				pull_request: {
					branch: response.repositoryEventConfig?.pullRequest?.branch || null,
				},
				push: {
					branch: response.repositoryEventConfig?.push?.branch || null,
				},
			},
			serviceAccount: serviceAccount.fullName,
			id: response.id,
		}

		return triggerDetails
	})

export const runCloudBuildTriggerServerFn = createServerFn({
	method: 'POST',
})
	.inputValidator(
		z.object({
			triggerName: z.string().min(1, 'Trigger name is required'),
			location: z.string().min(1, 'Location is required'),
			triggerId: z.string().min(1, 'Trigger ID is required'),
			branchName: z.string().min(1, 'Branch name is required'),
		}),
	)
	.handler(async ({ data }) => {
		const projectId = await cloudBuildClient.getProjectId()

		const request: GoogleProtos.devtools.cloudbuild.v1.IRunBuildTriggerRequest =
			{
				projectId,
				triggerId: data.triggerId,
				name: `projects/${projectId}/locations/${data.location}/triggers/${data.triggerName}`,
				source: {
					branchName: data.branchName,
				},
			}

		const [operation] = await cloudBuildClient.runBuildTrigger(request)

		// Extract serializable metadata
		let buildId: string | null = null
		let metadataInfo: Record<string, string | number | boolean | null> = {}

		if (operation.metadata) {
			try {
				// Cast metadata to access build property (we know from logs it exists)
				const metadata = operation.metadata as {
					build?: {
						id?: string
						status?: number
						logUrl?: string
						createTime?: unknown
						projectId?: string
						substitutions?: Record<string, string>
					}
				}

				// Check if metadata has build object directly (which it does based on logs)
				if (metadata.build) {
					buildId = metadata.build.id || null

					// Extract useful build information
					metadataInfo = {
						buildId: metadata.build.id || null,
						status: metadata.build.status || null,
						logUrl: metadata.build.logUrl || null,
						projectId: metadata.build.projectId || null,
						// Note: substitutions is an object, so we'll stringify it for now
						substitutions: metadata.build.substitutions
							? JSON.stringify(metadata.build.substitutions)
							: null,
					}
				} else {
					console.log('No build object in metadata')
				}
			} catch (error) {
				console.log('Error extracting metadata:', error)
			}
		} else {
			console.log('No metadata in operation')
		}

		return {
			operationName: operation.name || null,
			buildId,
			metadataInfo,
			done: operation.done || false,
		}
	})

export const getBuildServerFn = createServerFn({
	method: 'GET',
})
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(
		z.object({
			buildId: z.string().min(1, 'Build ID is required'),
			location: z.string().min(1, 'Location is required'),
		}),
	)
	.handler(async ({ data }) => {
		const projectId = await cloudBuildClient.getProjectId()

		const request: GoogleProtos.devtools.cloudbuild.v1.IGetBuildRequest = {
			projectId,
			name: `projects/${projectId}/locations/${data.location}/builds/${data.buildId}`,
			id: data.buildId,
		}

		try {
			const [build] = await cloudBuildClient.getBuild(request)

			if (!build) {
				throw new Error('Build not found')
			}

			// Convert build to serializable format
			return {
				id: build.id || null,
				status: build.status || null,
				logUrl: build.logUrl || null,
				createTime: build.createTime
					? new Date(Number(build.createTime.seconds) * 1000)
					: null,
				finishTime: build.finishTime
					? new Date(Number(build.finishTime.seconds) * 1000)
					: null,
				projectId: build.projectId || null,
				sourceProvenance: {
					resolvedRepoSource:
						build.sourceProvenance?.resolvedRepoSource || null,
				},
				substitutions: build.substitutions || {},
				tags: build.tags || [],
				name: build.name || null,
			}
		} catch (error) {
			console.error('Error getting build:', error)
			throw new Error('Build not found or inaccessible')
		}
	})

export const updateCloudBuildTriggerServerFn = createServerFn({
	method: 'POST',
})
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(
		z
			.object({
				trigger: z.object({
					triggerId: z.string().min(1, 'Trigger ID is required'),
					location: z.string().min(1, 'Location is required'),
					name: z.string().min(1, 'Trigger name is required'),
				}),
			})
			.extend(
				applicationSchema.pick({
					port: true,
					memory: true,
					allow_public_access: true,
					number_of_cpus: true,
				}).shape,
			),
	)
	.handler(async ({ data }) => {
		const projectId = await cloudBuildClient.getProjectId()

		// First, get the existing trigger to preserve other settings
		const getTriggerRequest: GoogleProtos.devtools.cloudbuild.v1.IGetBuildTriggerRequest =
			{
				projectId,
				triggerId: data.trigger.triggerId,
				name: `projects/${projectId}/locations/${data.trigger.location}/triggers/${data.trigger.name}`,
			}

		const [existingTrigger] =
			await cloudBuildClient.getBuildTrigger(getTriggerRequest)

		if (!existingTrigger || !existingTrigger.build) {
			throw new Error('Build trigger not found')
		}

		// Update the substitutions with new values
		const updatedSubstitutions = {
			...existingTrigger.build.substitutions,
			_PORT: data.port.toString(),
			_MEMORY: data.memory,
			_NUM_CPUS: data.number_of_cpus.toString(),
		}

		// Update the Cloud Run deploy step to use new ingress setting
		const updatedSteps = existingTrigger.build.steps?.map((step) => {
			if (
				step.id === 'Deploy' &&
				step.name === 'gcr.io/google.com/cloudsdktool/cloud-sdk:slim'
			) {
				const updatedArgs = step.args?.map((arg) => {
					if (arg.startsWith('--ingress=')) {
						return data.allow_public_access
							? '--ingress=all'
							: '--ingress=internal'
					}
					return arg
				})
				return { ...step, args: updatedArgs }
			}
			return step
		})

		const updateRequest: GoogleProtos.devtools.cloudbuild.v1.IUpdateBuildTriggerRequest =
			{
				projectId,
				triggerId: data.trigger.triggerId,
				trigger: {
					...existingTrigger,
					build: {
						...existingTrigger.build,
						steps: updatedSteps,
						substitutions: updatedSubstitutions,
					},
				},
			}

		const [response] = await cloudBuildClient.updateBuildTrigger(updateRequest)

		return {
			id: response.id,
			name: response.name,
			success: true,
		}
	})

export const deleteCloudBuildTriggerServerFn = createServerFn({
	method: 'POST',
})
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(
		z.object({
			triggerId: z.string().min(1, 'Trigger ID is required'),
			location: z.string().min(1, 'Location is required'),
			name: z.string().min(1, 'Trigger name is required'),
		}),
	)
	.handler(async ({ data }) => {
		const projectId = await cloudBuildClient.getProjectId()

		const deleteRequest: GoogleProtos.devtools.cloudbuild.v1.IDeleteBuildTriggerRequest =
			{
				projectId,
				triggerId: data.triggerId,
				name: `projects/${projectId}/locations/${data.location}/triggers/${data.name}`,
			}

		try {
			await cloudBuildClient.deleteBuildTrigger(deleteRequest)

			return {
				success: true,
				triggerId: data.triggerId,
			}
		} catch (error) {
			console.error('Error deleting build trigger:', error)
			throw new Error('Failed to delete build trigger')
		}
	})
