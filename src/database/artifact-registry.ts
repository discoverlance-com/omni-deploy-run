import { Timestamp } from '@google-cloud/firestore'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod/v4'

import { getFirestoreClient } from '@/lib/firestore-client'

const artifactRegistrySchema = z.object({
	name: z.string(),
	repositoryId: z.string(),
	uri: z.string().optional(),
	description: z.string().optional(),
	updated_at: z.date().optional(),
	created_at: z.date().optional(),
})

type ArtifactRegistry = z.infer<typeof artifactRegistrySchema>
const ARTIFACT_REGISTRYS_COLLECTION = 'repositories'

export const createArtifactRegistry = createServerFn({ method: 'POST' })
	.inputValidator(
		artifactRegistrySchema.omit({ created_at: true, updated_at: true }),
	)
	.handler(async ({ data }) => {
		const db = getFirestoreClient()
		const now = Timestamp.now()
		const registryData = {
			...data,
			created_at: now,
			updated_at: now,
		}

		// Use registry as the document ID (e.g., projects/omni-deploy-run/locations/us/repositories/gcr.io)
		const docId = data.name
		const docRef = db.collection(ARTIFACT_REGISTRYS_COLLECTION).doc(docId)

		await docRef.set(registryData)

		return {
			...{
				...registryData,
				created_at: now.toDate(),
				updated_at: now.toDate(),
			},
			id: docId,
		}
	})

export const getAllArtifactRegistries = createServerFn({
	method: 'GET',
}).handler(async () => {
	const db = getFirestoreClient()
	const snapshot = await db.collection(ARTIFACT_REGISTRYS_COLLECTION).get()

	return snapshot.docs.map((doc) => {
		const data = doc.data()
		return {
			...(data as ArtifactRegistry),
			id: doc.id,
			created_at: data.created_at?.toDate?.() || data.created_at,
			updated_at: data.updated_at?.toDate?.() || data.updated_at,
		}
	})
})

export const updateArtifactRegistry = createServerFn({ method: 'POST' })
	.inputValidator(
		artifactRegistrySchema.partial().extend({
			artifactRegistryId: artifactRegistrySchema.shape.name,
		}),
	)
	.handler(async ({ data }) => {
		const db = getFirestoreClient()
		if (!data.name) {
			throw new Error('Connection ID is required')
		}

		const now = new Date()
		const updateData = {
			...data,
			updated_at: now,
		}

		const docRef = db.collection(ARTIFACT_REGISTRYS_COLLECTION).doc(data.name)

		// Check if document exists
		const doc = await docRef.get()
		if (!doc.exists) {
			throw new Error(`Artifact Registry with ID ${data.name} not found`)
		}

		await docRef.update(updateData)

		const updatedDoc = await docRef.get()
		const updatedData = updatedDoc.data()
		return {
			...updatedData,
			id: updatedDoc.id,
			// Convert Firestore Timestamps to JS Dates
			created_at:
				updatedData?.created_at?.toDate?.() || updatedData?.created_at,
			updated_at:
				updatedData?.updated_at?.toDate?.() || updatedData?.updated_at,
		}
	})
