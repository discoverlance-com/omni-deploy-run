import { Firestore } from '@google-cloud/firestore'

import { env } from '@/env'

// Create a new client
let firestore: Firestore | undefined

export const getFirestoreClient = () => {
	if (!firestore) {
		firestore = new Firestore({
			databaseId: env.FIRESTORE_DATABASE_ID,
			projectId:
				process.env.NODE_ENV !== 'production' ? env.GCP_PROJECT_ID : undefined,
		})
	}

	return firestore
}
