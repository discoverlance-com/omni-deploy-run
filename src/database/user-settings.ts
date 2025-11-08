import { Timestamp } from '@google-cloud/firestore'
import { createServerFn } from '@tanstack/react-start'

import { getFirestoreClient } from '@/lib/firestore-client'
import { requireAuthentedUserMiddleware } from '@/utils/auth'
import { type UserSettings, userSettingsSchema } from '@/utils/validation'

const COLLECTION_NAME = 'user_settings'

export const getUserSettings = createServerFn({ method: 'GET' })
	.middleware([requireAuthentedUserMiddleware])
	.handler(async ({ context }) => {
		const firestore = getFirestoreClient()
		const userId = context.session.user.id
		const documentRef = firestore.collection(COLLECTION_NAME).doc(userId)
		const documentSnapshot = await documentRef.get()

		if (documentSnapshot.exists) {
			const data = documentSnapshot.data()
			return {
				id: documentSnapshot.id,
				...(data as UserSettings),
				updated_at: (data?.updated_at as Timestamp)?.toDate(),
				created_at: (data?.created_at as Timestamp)?.toDate(),
			} as UserSettings & { id: string }
		}

		// Create default settings if none exist
		const defaultSettings: UserSettings = {
			selected_connection_location: 'us-central1',
			updated_at: new Date(),
			created_at: new Date(),
		}

		await documentRef.set({
			...defaultSettings,
			updated_at: Timestamp.now(),
			created_at: Timestamp.now(),
		})

		return {
			id: userId,
			...defaultSettings,
		}
	})

export const updateUserSettings = createServerFn({ method: 'POST' })
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(userSettingsSchema.partial())
	.handler(async ({ data, context }) => {
		const firestore = getFirestoreClient()
		const userId = context.session.user.id
		const documentRef = firestore.collection(COLLECTION_NAME).doc(userId)

		await documentRef.set(
			{
				...data,
				updated_at: Timestamp.now(),
			},
			{ merge: true },
		)

		const updated = await documentRef.get()
		const updatedData = updated.data()

		return {
			id: updated.id,
			...(updatedData as UserSettings),
			updated_at: (updatedData?.updated_at as Timestamp)?.toDate(),
			created_at: (updatedData?.created_at as Timestamp)?.toDate(),
		} as UserSettings & { id: string }
	})
