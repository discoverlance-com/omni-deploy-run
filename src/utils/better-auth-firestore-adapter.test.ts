import type { BetterAuthOptions } from 'better-auth'
import { runAdapterTest } from 'better-auth/adapters/test'
import { getAuthTables } from 'better-auth/db'
import { afterAll, describe } from 'vitest'

import { getFirestoreClient } from '@/lib/firestore-client'
import { firestoreAdapter } from './better-auth-firestore-adapter'

const adapter = firestoreAdapter(getFirestoreClient(), {
	debugLogs: {
		// If your adapter config allows passing in debug logs, then pass this here.
		isRunningAdapterTests: true, // This is our super secret flag to let us know to only log debug logs if a test fails.
	},
})

const getAdapter = () => adapter

const refreshAdapter = async (betterAuthOptions: BetterAuthOptions) => {
	return getAdapter()(betterAuthOptions)
}

/**
 * Cleanup function to remove all rows from the database.
 * BE CAREFUL IF YOU HAVE ITEMS ALREADY, THIS WILL DELETE THEM
 */
const cleanup = async (betterAuthOptions: BetterAuthOptions) => {
	const start = performance.now()
	await refreshAdapter(betterAuthOptions)
	const getAllModels = getAuthTables(betterAuthOptions)

	// Clean up all rows from all models
	for (const model of Object.keys(getAllModels)) {
		try {
			await getAdapter()(betterAuthOptions).deleteMany({
				model: model,
				where: [],
			})
		} catch (error) {
			const msg = `Error while cleaning up all rows from ${model}`
			console.error(msg, error)
			throw new Error(msg, {
				cause: error,
			})
		}
	}

	await refreshAdapter(betterAuthOptions)
	console.info(
		`CLEAN-UP: completed successfully (${(performance.now() - start).toFixed(3)}ms)`,
	)
}

describe.skip('Firestore Adapter Tests', async () => {
	afterAll(async () => {
		await cleanup({})
	}, 20000)

	await runAdapterTest({
		getAdapter: async (betterAuthOptions = {}) => {
			return adapter(betterAuthOptions)
		},
		disableTests: {
			// these operations/tests are not supported in firestore
			SHOULD_FIND_MANY_WITH_CONNECTORS: true,
			SHOULD_SEARCH_USERS_WITH_ENDS_WITH: true,
			SHOULD_SEARCH_USERS_WITH_STARTS_WITH: true,
			SHOULD_FIND_MANY_WITH_CONTAINS_OPERATOR: true,
			SHOULD_FIND_MANY_WITH_NOT_IN_OPERATOR: true,
		},
	})
})
