import { Timestamp } from '@google-cloud/firestore'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod/v4'

import { getFirestoreClient } from '@/lib/firestore-client'
import { deleteCloudBuildTriggerServerFn } from '@/lib/server-fns/cloud-build'
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
			connection_id: true,
			repository: true,
			tags: true,
			allow_public_access: true,
			git_branch: true,
			number_of_cpus: true,
			memory: true,
			trigger_details: true,
			region: true,
			port: true,
			service_account_id: true,
			environment_variables: true,
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
			git_branch: data.git_branch,
			port: data.port,
			region: data.region,
			allow_public_access: data.allow_public_access,
			memory: data.memory,
			number_of_cpus: data.number_of_cpus,
			environment_variables: data.environment_variables,
			last_deployment_status:
				'pending' as Application['last_deployment_status'],
			created_at: now,
			updated_at: now,
			...(data.service_account_id && {
				service_account_id: data.service_account_id,
			}),
			...(data.trigger_details && { trigger_details: data.trigger_details }),
		}

		await documentRef.set(docData)

		return { id: documentRef.id }
	})

export const updateApplication = createServerFn({
	method: 'POST',
})
	.inputValidator(
		applicationSchema
			.pick({
				allow_public_access: true,
				memory: true,
				port: true,
				number_of_cpus: true,
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
		if (data.allow_public_access !== undefined)
			updateData.allow_public_access = data.allow_public_access
		if (data.memory !== undefined) updateData.memory = data.memory
		if (data.number_of_cpus !== undefined)
			updateData.number_of_cpus = data.number_of_cpus
		if (data.port !== undefined) updateData.port = data.port
		if (data.last_deployment_status !== undefined)
			updateData.last_deployment_status = data.last_deployment_status

		await documentRef.update(updateData)

		return { success: true }
	})

export const addBuildToApplication = createServerFn({
	method: 'POST',
})
	.inputValidator(
		z.object({
			applicationId: z.string().min(1, 'Application ID is required'),
			buildInfo: z.object({
				id: z.string().min(1, 'Build ID is required'),
				timestamp: z.string().min(1, 'Build timestamp is required'),
			}),
		}),
	)
	.handler(async ({ data }) => {
		const firestore = getFirestoreClient()
		const documentRef = firestore
			.collection(COLLECTION_NAME)
			.doc(data.applicationId)

		// Get current application to update cloud_build_info array
		const doc = await documentRef.get()
		if (!doc.exists) {
			throw new Error('Application not found')
		}

		const currentData = doc.data() as Application
		const currentBuildInfo = currentData.cloud_build_info || []

		// Check if build ID already exists to avoid duplicates
		const existingBuild = currentBuildInfo.find(
			(build) => build.id === data.buildInfo.id,
		)
		if (existingBuild) {
			return { success: true, message: 'Build already exists in application' }
		}

		// Add new build to the array
		const updatedBuildInfo = [
			...currentBuildInfo,
			{
				id: data.buildInfo.id,
				timestamp: data.buildInfo.timestamp,
			},
		]

		// Update the document
		await documentRef.update({
			cloud_build_info: updatedBuildInfo,
			updated_at: Timestamp.now(),
		})

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

export const deleteApplicationComplete = createServerFn({
	method: 'POST',
})
	.inputValidator(
		z.object({
			id: z.string().min(1, 'Application ID is required'),
			triggerId: z.string().optional(),
			triggerName: z.string().optional(),
			applicationName: z.string().min(1, 'Application name is required'),
			region: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const firestore = getFirestoreClient()

		// First, delete the Cloud Build trigger if it exists
		if (data.triggerId && data.region) {
			await deleteCloudBuildTriggerServerFn({
				data: {
					triggerId: data.triggerId,
					location: data.region,
					name: data.triggerName ?? '',
					applicationName: data.applicationName,
				},
			})
		}

		// Only delete from Firestore if trigger deletion succeeded (or no trigger to delete)
		const documentRef = firestore.collection(COLLECTION_NAME).doc(data.id)
		await documentRef.delete()

		return { success: true }
	})
