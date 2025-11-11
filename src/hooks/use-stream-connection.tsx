import type { Collection } from '@tanstack/db'
import { useEffect, useRef } from 'react'

export function useCollectionStreamConnection(
	url: string,
	// biome-ignore lint/suspicious/noExplicitAny: not needed
	collection: Collection<any, any, any>,
) {
	const loadedRef = useRef(false)

	// biome-ignore lint/correctness/useExhaustiveDependencies: not needed
	useEffect(() => {
		const fetchData = async () => {
			if (loadedRef.current) return
			loadedRef.current = true

			const response = await fetch(url)
			const reader = response.body?.getReader()
			if (!reader) {
				return
			}

			const decoder = new TextDecoder()
			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				for (const chunk of decoder
					.decode(value, { stream: true })
					.split('\n')
					.filter((chunk) => chunk.length > 0)) {
					collection.insert(JSON.parse(chunk))
				}
			}
		}
		fetchData()
	}, [])
}
