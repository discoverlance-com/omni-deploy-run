import { v2 } from '@google-cloud/iam'

import { env } from '@/env'

export const iamPoliciesClient = new v2.PoliciesClient({
	projectId:
		process.env.NODE_ENV !== 'production' ? env.GCP_PROJECT_ID : undefined,
})
