import { v2 } from '@google-cloud/run'

import { env } from '@/env'

export const cloudRunServicesClient = new v2.ServicesClient({
	projectId:
		process.env.NODE_ENV !== 'production' ? env.GCP_PROJECT_ID : undefined,
})

export const cloudRunJobsClient = new v2.JobsClient({
	projectId:
		process.env.NODE_ENV !== 'production' ? env.GCP_PROJECT_ID : undefined,
})

export const cloudRunRevisionsClient = new v2.RevisionsClient({
	projectId:
		process.env.NODE_ENV !== 'production' ? env.GCP_PROJECT_ID : undefined,
})
