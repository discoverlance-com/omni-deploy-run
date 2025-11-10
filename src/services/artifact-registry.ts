import { v1 } from '@google-cloud/artifact-registry'

import { env } from '@/env'

export const artifactRegistryClient = new v1.ArtifactRegistryClient({
	projectId:
		process.env.NODE_ENV !== 'production' ? env.GCP_PROJECT_ID : undefined,
})
