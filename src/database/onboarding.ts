import { Timestamp } from '@google-cloud/firestore'
import { createServerFn } from '@tanstack/react-start'

import { getFirestoreClient } from '@/lib/firestore-client'

const COLLECTION_NAME = 'onboarding'

interface Onboarding {
	is_app_setup_complete: boolean
	updated_at: Date
	created_at: Date
}

export const getOnboarding = createServerFn({
	method: 'GET',
}).handler(async () => {
	const firestore = getFirestoreClient()
	const documentRef = firestore.collection(COLLECTION_NAME).doc('app')
	const documentSnapshot = await documentRef.get()

	if (documentSnapshot.exists) {
		const data = documentSnapshot.data()
		return {
			id: documentSnapshot.id,
			...(documentSnapshot.data() as Onboarding),
			updated_at: (data?.updated_at as Timestamp)?.toDate(),
			created_at: (data?.created_at as Timestamp)?.toDate(),
		}
	}

	return null
})

export const markAppSetupAsComplete = createServerFn({
	method: 'GET',
}).handler(async () => {
	const firestore = getFirestoreClient()
	const documentRef = firestore.collection(COLLECTION_NAME).doc('app')

	await documentRef.set(
		{
			is_app_setup_complete: true,
			updated_at: Timestamp.now(),
			created_at: Timestamp.now(),
		},
		{ merge: true },
	)
})
