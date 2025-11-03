import { Timestamp } from '@google-cloud/firestore'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod/v4'

import { getFirestoreClient } from '@/lib/firestore-client'
import { type Project, projectSchema } from '@/utils/validation'

const COLLECTION_NAME = 'projects'

async function isProjectNameUnique(
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

export const getProjects = createServerFn({
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
			...(info as Project),
			updated_at: (info?.updated_at as Timestamp)?.toDate(),
			created_at: (info?.created_at as Timestamp)?.toDate(),
		}
	})
})

export const getProjectById = createServerFn({
	method: 'GET',
})
	.inputValidator(
		z.object({
			id: z.string().min(1, 'Project ID is required'),
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
			...(info as Project),
			updated_at: (info?.updated_at as Timestamp)?.toDate(),
			created_at: (info?.created_at as Timestamp)?.toDate(),
		}
	})

export const createProject = createServerFn({
	method: 'POST',
})
	.inputValidator(projectSchema.pick({ name: true, description: true }))
	.handler(async ({ data }) => {
		const isUnique = await isProjectNameUnique(data.name)
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
			created_at: now,
			updated_at: now,
		}

		if (data.description) {
			docData.description = data.description
		}

		await documentRef.set(docData)

		return { id: documentRef.id }
	})

export const updateProject = createServerFn({
	method: 'POST',
})
	.inputValidator(
		projectSchema
			.pick({ name: true, description: true })
			.partial()
			.extend({
				id: z.string().min(1, 'Project ID is required'),
			}),
	)
	.handler(async ({ data }) => {
		const firestore = getFirestoreClient()
		const documentRef = firestore.collection(COLLECTION_NAME).doc(data.id)

		const updateData: Record<string, unknown> = { updated_at: Timestamp.now() }

		if (data.name !== undefined) updateData.name = data.name
		if (data.description !== undefined)
			updateData.description = data.description

		await documentRef.update(updateData)

		return { success: true }
	})

export const deleteProject = createServerFn({
	method: 'POST',
})
	.inputValidator(
		z.object({
			id: z.string().min(1, 'Project ID is required'),
		}),
	)
	.handler(async ({ data }) => {
		const firestore = getFirestoreClient()
		const documentRef = firestore.collection(COLLECTION_NAME).doc(data.id)

		await documentRef.delete()

		return { success: true }
	})
