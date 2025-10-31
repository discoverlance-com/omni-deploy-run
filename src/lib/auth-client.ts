import {
	lastLoginMethodClient,
	passkeyClient,
	adminClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { toast } from 'sonner'

export const authClient = createAuthClient({
	fetchOptions: {
		onError(e) {
			if (e.error.status === 429) {
				toast.error('Too many requests. Please try again later.')
			}
		},
	},
	plugins: [passkeyClient(), lastLoginMethodClient(), adminClient()],
})

export const { signIn, signUp, useSession, signOut } = authClient
