import { firestoreAdapter } from '@/utils/better-auth-firestore-adapter'
import { getFirestoreClient } from './firestore-client'

export const authAdapter = firestoreAdapter(getFirestoreClient(), {
	usePlural: true, // This will use collection names like 'users', 'sessions'
	debugLogs: process.env.NODE_ENV === 'development', // Only show logs in development
})
