// biome-ignore-all lint/suspicious/noExplicitAny: any works for the adapter expected type
import {
	type CollectionReference,
	type DocumentSnapshot,
	FieldPath,
	type Firestore,
	type Query,
	Timestamp,
} from '@google-cloud/firestore'
import type { BetterAuthOptions, Where } from 'better-auth'
import {
	createAdapterFactory,
	type DBAdapterDebugLogOption,
} from 'better-auth/adapters'

export interface FirebaseAdapterConfig {
	/**
	 * Enable debug logs for the adapter
	 * @default false
	 */
	debugLogs?: DBAdapterDebugLogOption
	/**
	 * Use plural table names
	 * @default false
	 */
	usePlural?: boolean
}

export const firestoreAdapter = (
	firestore: Firestore,
	config?: FirebaseAdapterConfig,
) => {
	const getCustomIdGenerator = (options: BetterAuthOptions) => {
		const generator =
			options.advanced?.database?.generateId || options.advanced?.generateId
		if (typeof generator === 'function') return generator
		return undefined
	}

	return createAdapterFactory({
		config: {
			adapterId: 'firebase-adapter',
			adapterName: 'Firebase Adapter',
			usePlural: config?.usePlural ?? false,
			debugLogs: config?.debugLogs ?? false,
			// Transforms 'id' from Better Auth to '_id' for internal use.
			mapKeysTransformInput: { id: '_id' },
			// Transforms '_id' from the adapter's response back to 'id' for Better Auth.
			mapKeysTransformOutput: { _id: 'id' },
			supportsNumericIds: false,
			supportsBooleans: true,
			customTransformInput({ action, data, field, fieldAttributes, options }) {
				const customIdGen = getCustomIdGenerator(options)
				if (field === 'id' || fieldAttributes.references?.field === 'id') {
					if (customIdGen) return data
					if (Array.isArray(data)) {
						return data.map((v) => {
							if (typeof v === 'string') return v
							throw new Error('Invalid id array value: must be strings')
						})
					}
					if (typeof data === 'string') return data
					if (action === 'create' && data === undefined) return undefined
				}
				return data
			},
			// This function now receives the string ID value and simply returns it.
			// The error occurred because `data` was undefined before.
			customTransformOutput({ data, field, fieldAttributes }) {
				if (field === 'id' || fieldAttributes.references?.field === 'id') {
					return data // Firestore IDs are strings, no transformation needed.
				}
				return data
			},
		},
		adapter: ({ getFieldName, getDefaultModelName }) => {
			function getCollection(model: string): CollectionReference {
				return firestore.collection(getDefaultModelName(model))
			}

			function buildFirestoreQuery(model: string, where: Where[]): Query {
				let query: Query = getCollection(model)
				for (const w of where) {
					const { field: field_, value, operator = 'eq', connector = 'AND' } = w

					if (value === undefined) {
						continue
					}

					const field = getFieldName({ model, field: field_ })
					if (connector === 'OR') {
						throw new Error(
							"Firestore adapter does not support 'OR' connectors.",
						)
					}
					const queryField = field === 'id' ? FieldPath.documentId() : field
					// ... (rest of switch statement is unchanged)
					switch (operator.toLowerCase()) {
						case 'eq':
							query = query.where(queryField, '==', value)
							break
						case 'ne':
							query = query.where(queryField, '!=', value)
							break
						case 'in':
							if (!Array.isArray(value) || value.length === 0) {
								return query.where(
									FieldPath.documentId(),
									'==',
									'__this_id_will_not_exist__',
								)
							}
							query = query.where(queryField, 'in', value)
							break
						case 'gt':
							query = query.where(queryField, '>', value)
							break
						case 'gte':
							query = query.where(queryField, '>=', value)
							break
						case 'lt':
							query = query.where(queryField, '<', value)
							break
						case 'lte':
							query = query.where(queryField, '<=', value)
							break
						case 'contains':
						case 'starts_with':
						case 'ends_with':
							throw new Error(
								`Firestore does not support operator: ${operator}`,
							)
						default:
							throw new Error(`Unsupported operator: ${operator}`)
					}
				}
				return query
			}

			function extractData(doc: DocumentSnapshot) {
				if (!doc.exists) return null
				const rawData = doc.data()
				if (!rawData) return null

				// Recursively convert all Timestamp objects back to JavaScript Dates.
				const data = Object.fromEntries(
					Object.entries(rawData).map(([key, value]) => {
						if (value instanceof Timestamp) {
							return [key, value.toDate()]
						}
						return [key, value]
					}),
				)

				return {
					_id: doc.id,
					...data,
				}
			}

			return {
				async create({ model, data: values }) {
					const collection = getCollection(model)
					if (values._id) {
						const id = values._id as string
						delete values._id
						await collection.doc(id).set(values)
						return { _id: id, ...values } as any // Return with _id
					}
					const docRef = await collection.add(values)
					return { _id: docRef.id, ...values } as any // Return with _id
				},

				async findOne({ model, where, select }) {
					let query = buildFirestoreQuery(model, where).limit(1)

					if (select && select.length > 0) {
						const selectFields = select.map((field) =>
							getFieldName({ field, model }),
						)
						query = query.select(...selectFields)
					}

					const snapshot = await query.get()
					if (snapshot.empty) return null
					// This now correctly returns an object with '_id'
					return extractData(snapshot.docs[0]) as any
				},

				async findMany({ model, where, limit, offset, sortBy }) {
					let query: Query = where
						? buildFirestoreQuery(model, where)
						: getCollection(model)
					if (sortBy) {
						const field = getFieldName({ field: sortBy.field, model })
						const direction = sortBy.direction === 'desc' ? 'desc' : 'asc'
						const sortField = field === 'id' ? FieldPath.documentId() : field
						query = query.orderBy(sortField, direction)
					}
					if (offset && offset > 0) query = query.offset(offset)
					if (limit) query = query.limit(limit)
					const snapshot = await query.get()
					// This now correctly returns an array of objects with '_id'
					return snapshot.docs.map(extractData) as any
				},

				async count({ model }) {
					const snapshot = await getCollection(model).count().get()
					return snapshot.data().count
				},

				async update({ model, where, update: values }) {
					if (
						typeof values !== 'object' ||
						values === null ||
						Array.isArray(values)
					) {
						throw new Error('Invalid update data: must be a non-null object.')
					}
					let docRef: FirebaseFirestore.DocumentReference | undefined

					// Check for the common case: updating by a single ID.
					if (
						where.length === 1 &&
						where[0].field === 'id' &&
						(where[0].operator === 'eq' || !where[0].operator)
					) {
						const docId = where[0].value as string
						if (docId) {
							docRef = getCollection(model).doc(docId)
						}
					}

					// If we couldn't build a direct reference, fall back to the query method.
					if (!docRef) {
						const query = buildFirestoreQuery(model, where).limit(1)
						const snapshot = await query.get()
						if (snapshot.empty) return null
						docRef = snapshot.docs[0].ref
					}

					// Now, perform the update and get the result
					await docRef.update(values)
					const updatedDoc = await docRef.get()

					// Check if the document still exists after update (it could have been deleted by a trigger)
					if (!updatedDoc.exists) return null

					return extractData(updatedDoc) as any
				},

				// ... updateMany, delete, deleteMany remain the same as they don't return documents ...
				async updateMany({ model, where, update: values }) {
					if (
						typeof values !== 'object' ||
						values === null ||
						Array.isArray(values)
					) {
						throw new Error('Invalid update data: must be a non-null object.')
					}
					const query = buildFirestoreQuery(model, where)
					const snapshot = await query.get()
					if (snapshot.empty) return 0
					const batch = firestore.batch()
					snapshot.docs.forEach((doc) => {
						batch.update(doc.ref, values)
					})
					await batch.commit()
					return snapshot.size
				},

				async delete({ model, where }) {
					const query = buildFirestoreQuery(model, where).limit(1)
					const snapshot = await query.get()
					if (snapshot.empty) return
					await snapshot.docs[0].ref.delete()
				},

				async deleteMany({ model, where }) {
					const query = buildFirestoreQuery(model, where)
					const snapshot = await query.get()
					if (snapshot.empty) return 0
					const batch = firestore.batch()
					snapshot.docs.forEach((doc) => {
						batch.delete(doc.ref)
					})
					await batch.commit()
					return snapshot.size
				},
			}
		},
	})
}
