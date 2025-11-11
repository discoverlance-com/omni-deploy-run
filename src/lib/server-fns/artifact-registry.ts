import type { google as GoogleProtos } from '@google-cloud/artifact-registry/build/protos/protos'
import { createServerFn } from '@tanstack/react-start'

import { artifactRegistryClient } from '@/services/artifact-registry'
import { onboardingFormSchema } from '@/utils/validation'

const GCR_LOCATION_MAP: { [key: string]: string } = {
	'gcr.io': 'us',
	'us.gcr.io': 'us',
	'eu.gcr.io': 'europe', // 👈 THE FIX: Must be 'europe', not 'eu'
	'asia.gcr.io': 'asia',
}

export const createArtifactRegistryServerFn = createServerFn({ method: 'POST' })
	.inputValidator(onboardingFormSchema.pick({ artifact_registry: true }))
	.handler(async ({ data }) => {
		const projectId = await artifactRegistryClient.getProjectId()

		const multiRegion = GCR_LOCATION_MAP[data.artifact_registry]

		if (!multiRegion) {
			throw new Error(
				`Invalid gcr.io domain specified: ${data.artifact_registry}`,
			)
		}

		const parent = `projects/${projectId}/locations/${multiRegion}`

		const request: GoogleProtos.devtools.artifactregistry.v1.ICreateRepositoryRequest =
			{
				parent,
				repository: {
					format: 'DOCKER',
					description: `gcr.io domain support repository for the ${data.artifact_registry} multi-region`,
				},
				repositoryId: data.artifact_registry,
			}

		try {
			const [operation] = await artifactRegistryClient.createRepository(request)
			const [response] = await operation.promise()

			return {
				name: response.name,
				uri: response.registryUri,
				description: response.description,
			}
		} catch (error) {
			// Check if error code is 6 (ALREADY_EXISTS)
			const errorCode = (error as { code?: number })?.code
			if (errorCode === 6) {
				return null
			}

			throw error
		}
	})
