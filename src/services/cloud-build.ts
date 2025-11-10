import { v1, v2 } from '@google-cloud/cloudbuild'

import { env } from '@/env'

export const repositoryManagerClient = new v2.RepositoryManagerClient({
	projectId:
		process.env.NODE_ENV !== 'production' ? env.GCP_PROJECT_ID : undefined,
})

export const cloudBuildClient = new v1.CloudBuildClient({
	projectId:
		process.env.NODE_ENV !== 'production' ? env.GCP_PROJECT_ID : undefined,
})
