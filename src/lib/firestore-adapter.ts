import { firestoreAdapter } from '@/utils/better-auth-firestore-adapter'
import { getFirestoreClient } from './firestore-client'

export const authAdapter = firestoreAdapter(getFirestoreClient(), {
	usePlural: true, // This will use collection names like 'users', 'sessions'
	debugLogs: false, // Only show logs in development
})
