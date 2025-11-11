import type { google as GoogleProtos } from '@google-cloud/cloudbuild/build/protos/protos'
import { createServerFn } from '@tanstack/react-start'
import z from 'zod/v4'

import { getAllArtifactRegistries } from '@/database/artifact-registry'
import { cloudBuildClient } from '@/services/cloud-build'
import { requireAuthentedUserMiddleware } from '@/utils/auth'
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

function _extractOwnerAndRepo(githubUri: string): {
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
	.inputValidator(cloudBuildTriggerSchema)
	.handler(async ({ data }) => {
		const projectId = await cloudBuildClient.getProjectId()

		const name = getApplicationName(data.applicationName)

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
					description:
						'GitHub Trigger created via Omni Deploy Run for the repository',

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
						},
					},
				},
			}

		const [response] = await cloudBuildClient.createBuildTrigger(request)

		const triggerDetails = {
			name: response.name,
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
		}),
	)
	.handler(async ({ data }) => {
		const projectId = await cloudBuildClient.getProjectId()

		const request: GoogleProtos.devtools.cloudbuild.v1.IRunBuildTriggerRequest =
			{
				projectId,
				triggerId: 'f754153a-f752-4408-984e-b72c0b556c01',
				name: `projects/${projectId}/locations/${data.location}/triggers/${data.triggerName}`,
				source: {
					branchName: 'main',
				},
			}

		const [operation] = await cloudBuildClient.runBuildTrigger(request)

		const [response] = await operation.promise()
		console.log({ response })
	})
