import { Logging } from '@google-cloud/logging'

import { env } from '@/env'

export const cloudLoggingClient = new Logging({
	projectId:
		process.env.NODE_ENV !== 'production' ? env.GCP_PROJECT_ID : undefined,
})
