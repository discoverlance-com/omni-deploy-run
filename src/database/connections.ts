import { Timestamp } from '@google-cloud/firestore'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod/v4'

import { getFirestoreClient } from '@/lib/firestore-client'
import { requireAuthentedUserMiddleware } from '@/utils/auth'
import type { Connection } from '@/utils/validation'
import { connectionSchema } from '@/utils/validation'

const connectionIdSchema = z.object({
	connectionId: z.string(),
})

const connectionsArraySchema = z.object({
	connections: z.array(connectionSchema),
})

const CONNECTIONS_COLLECTION = 'connections'

export const createConnection = createServerFn({ method: 'POST' })
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(connectionSchema.omit({ created_at: true, updated_at: true }))
	.handler(async ({ data }) => {
		const db = getFirestoreClient()
		const now = Timestamp.now()
		const connectionData = {
			...data,
			created_at: now,
			updated_at: now,
		}

		// Use connectionId as the document ID (e.g., omni-deploy-run-github-connection)
		const docId = data.connectionId || data.displayName
		const docRef = db.collection(CONNECTIONS_COLLECTION).doc(docId)

		await docRef.set(connectionData)

		return {
			...{
				...connectionData,
				created_at: now.toDate(),
				updated_at: now.toDate(),
			},
			id: docId,
		}
	})

export const updateConnection = createServerFn({ method: 'POST' })
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(
		connectionSchema.partial().extend({
			connectionId: connectionSchema.shape.connectionId,
		}),
	)
	.handler(async ({ data }) => {
		const db = getFirestoreClient()
		if (!data.connectionId) {
			throw new Error('Connection ID is required')
		}

		const now = new Date()
		const updateData = {
			...data,
			updated_at: now,
		}

		const docRef = db.collection(CONNECTIONS_COLLECTION).doc(data.connectionId)

		// Check if document exists
		const doc = await docRef.get()
		if (!doc.exists) {
			throw new Error(`Connection with ID ${data.connectionId} not found`)
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
			...(updatedData?.createTime && {
				createTime:
					updatedData.createTime?.toDate?.() || updatedData.createTime,
			}),
			...(updatedData?.updateTime && {
				updateTime:
					updatedData.updateTime?.toDate?.() || updatedData.updateTime,
			}),
		} as Connection
	})

export const getAllConnections = createServerFn({ method: 'GET' })
	.middleware([requireAuthentedUserMiddleware])
	.handler(async () => {
		const db = getFirestoreClient()
		const snapshot = await db.collection(CONNECTIONS_COLLECTION).get()

		const connections: Connection[] = []
		snapshot.forEach((doc) => {
			const data = doc.data()
			connections.push({
				...data,
				id: doc.id,
				// Convert Firestore Timestamps to JS Dates
				created_at: data.created_at?.toDate?.() || data.created_at,
				updated_at: data.updated_at?.toDate?.() || data.updated_at,
				...(data.createTime && {
					createTime: data.createTime?.toDate?.() || data.createTime,
				}),
				...(data.updateTime && {
					updateTime: data.updateTime?.toDate?.() || data.updateTime,
				}),
			} as Connection)
		})

		return connections
	})

export const getConnectionByConnectionId = createServerFn({ method: 'GET' })
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(connectionIdSchema)
	.handler(async ({ data }) => {
		const db = getFirestoreClient()
		if (!data.connectionId) {
			throw new Error('Connection ID is required')
		}

		const docRef = db.collection(CONNECTIONS_COLLECTION).doc(data.connectionId)
		const doc = await docRef.get()

		if (!doc.exists) {
			throw new Error(`Connection with ID ${data.connectionId} not found`)
		}

		const docData = doc.data()
		return {
			...docData,
			id: doc.id,
			// Convert Firestore Timestamps to JS Dates
			created_at: docData?.created_at?.toDate?.() || docData?.created_at,
			updated_at: docData?.updated_at?.toDate?.() || docData?.updated_at,
			...(docData?.createTime && {
				createTime: docData.createTime?.toDate?.() || docData.createTime,
			}),
			...(docData?.updateTime && {
				updateTime: docData.updateTime?.toDate?.() || docData.updateTime,
			}),
		} as Connection
	})

export const deleteConnection = createServerFn({ method: 'POST' })
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(connectionIdSchema)
	.handler(async ({ data }) => {
		const db = getFirestoreClient()
		if (!data.connectionId) {
			throw new Error('Connection ID is required')
		}

		const docRef = db.collection(CONNECTIONS_COLLECTION).doc(data.connectionId)

		// Check if document exists
		const doc = await docRef.get()
		if (!doc.exists) {
			throw new Error(`Connection with ID ${data.connectionId} not found`)
		}

		await docRef.delete()

		return { success: true, connectionId: data.connectionId }
	})

export const updateConnectionsBatch = createServerFn({ method: 'POST' })
	.middleware([requireAuthentedUserMiddleware])
	.inputValidator(connectionsArraySchema)
	.handler(async ({ data }) => {
		const db = getFirestoreClient()
		const batch = db.batch()
		const now = new Date()

		for (const connection of data.connections) {
			if (!connection.connectionId) {
				throw new Error('All connections must have a connectionId')
			}

			const docRef = db
				.collection(CONNECTIONS_COLLECTION)
				.doc(connection.connectionId)
			const updateData = {
				...connection,
				updated_at: now,
			}

			batch.set(docRef, updateData, { merge: true })
		}

		await batch.commit()

		return { success: true, count: data.connections.length }
	})
