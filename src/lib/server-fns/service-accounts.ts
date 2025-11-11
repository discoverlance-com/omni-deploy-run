import { auth } from '@googleapis/iam'
import { createServerFn } from '@tanstack/react-start'

export const getAppServiceAccountServerFn = createServerFn().handler(
	async () => {
		const authClient = new auth.GoogleAuth({
			scopes: ['https://www.googleapis.com/auth/cloud-platform'],
		})
		const projectId = await authClient.getProjectId()

		const creds = await authClient.getCredentials()

		return {
			email: creds.client_email,
			projectId,
			fullName: `projects/${projectId}/serviceAccounts/${creds.client_email}`,
		}
	},
)
