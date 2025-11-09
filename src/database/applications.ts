import { Timestamp } from '@google-cloud/firestore'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod/v4'

import { getFirestoreClient } from '@/lib/firestore-client'
import { type Application, applicationSchema } from '@/utils/validation'

const COLLECTION_NAME = 'applications'

async function isApplicationNameUnique(
	name: string,
	excludeId?: string,
): Promise<boolean> {
	const firestore = getFirestoreClient()
	const query = firestore.collection(COLLECTION_NAME).where('name', '==', name)
	const snapshot = await query.get()

	// If updating, exclude the current project by ID
	const exists = snapshot.docs.some((doc) => doc.id !== excludeId)

	return !exists
}

export const getApplications = createServerFn({
	method: 'GET',
}).handler(async () => {
	const firestore = getFirestoreClient()
	const documentRef = firestore.collection(COLLECTION_NAME)
	const documentSnapshot = await documentRef.get()

	if (documentSnapshot.empty) {
		return []
	}

	return documentSnapshot.docs.map((item) => {
		const info = item.data()

		return {
			id: item.id,
			...(info as Application),
			last_deployed_at: (info?.last_deployed_at as Timestamp)?.toDate(),
			updated_at: (info?.updated_at as Timestamp)?.toDate(),
			created_at: (info?.created_at as Timestamp)?.toDate(),
		}
	})
})

export const getApplicationById = createServerFn({
	method: 'GET',
})
	.inputValidator(
		z.object({
			id: z.string().min(1, 'Application ID is required'),
		}),
	)
	.handler(async ({ data }) => {
		const firestore = getFirestoreClient()
		const documentRef = firestore.collection(COLLECTION_NAME).doc(data.id)
		const doc = await documentRef.get()

		if (!doc.exists) {
			return null
		}

		const info = doc.data()

		return {
			id: doc.id,
			...(info as Application),
			last_deployed_at: (info?.last_deployed_at as Timestamp)?.toDate(),
			updated_at: (info?.updated_at as Timestamp)?.toDate(),
			created_at: (info?.created_at as Timestamp)?.toDate(),
		}
	})

export const createApplication = createServerFn({
	method: 'POST',
})
	.inputValidator(
		applicationSchema.pick({
			name: true,
			description: true,
			connection_id: true,
			repository: true,
			tags: true,
		}),
	)
	.handler(async ({ data }) => {
		const isUnique = await isApplicationNameUnique(data.name)
		if (!isUnique) {
			throw Error(
				JSON.stringify([
					{
						path: ['name'],
						message: 'Project name must be unique',
					},
				]),
			)
		}

		const firestore = getFirestoreClient()
		const documentRef = firestore.collection(COLLECTION_NAME).doc()
		const now = Timestamp.now()

		const docData: Record<string, unknown> = {
			name: data.name,
			tags: data.tags,
			repository: data.repository,
			connection_id: data.connection_id,
			last_deployment_status:
				'pending' as Application['last_deployment_status'],
			created_at: now,
			updated_at: now,
		}

		await documentRef.set(docData)

		return { id: documentRef.id }
	})

export const updateProject = createServerFn({
	method: 'POST',
})
	.inputValidator(
		applicationSchema
			.pick({
				description: true,
				connection_id: true,
				repository: true,
				tags: true,
				last_deployment_status: true,
				url: true,
				last_deployed_at: true,
			})
			.partial()
			.extend({
				id: z.string().min(1, 'Application ID is required'),
			}),
	)
	.handler(async ({ data }) => {
		const firestore = getFirestoreClient()
		const documentRef = firestore.collection(COLLECTION_NAME).doc(data.id)

		const updateData: Record<string, unknown> = { updated_at: Timestamp.now() }

		if (data.last_deployed_at !== undefined)
			updateData.last_deployed_at = data.last_deployed_at
		if (data.tags !== undefined) updateData.tags = data.tags
		if (data.repository !== undefined) updateData.repository = data.repository
		if (data.url !== undefined) updateData.url = data.url
		if (data.connection_id !== undefined)
			updateData.connection_id = data.connection_id

		await documentRef.update(updateData)

		return { success: true }
	})

export const deleteApplication = createServerFn({
	method: 'POST',
})
	.inputValidator(
		z.object({
			id: z.string().min(1, 'Application ID is required'),
		}),
	)
	.handler(async ({ data }) => {
		const firestore = getFirestoreClient()
		const documentRef = firestore.collection(COLLECTION_NAME).doc(data.id)

		await documentRef.delete()

		return { success: true }
	})
