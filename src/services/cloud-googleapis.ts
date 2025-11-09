import { auth, iam_v1 } from '@googleapis/iam'

export const listAllProjectServiceAccounts = async () => {
	const googleAuth = new auth.GoogleAuth({
		scopes: ['https://www.googleapis.com/auth/cloud-platform'],
	})
	const authClient = await googleAuth.getClient()

	const iam = new iam_v1.Iam({
		//@ts-expect-error ignore the client works
		auth: authClient,
	})

	const res = await iam.projects.serviceAccounts.list({
		pageSize: 100,
		name: `projects/${authClient.projectId}`,
	})

	return res.data.accounts || []
}
