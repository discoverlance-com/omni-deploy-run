import { useEffect } from 'react'

import { useLatest } from '@/hooks/use-latest'

export function useUnmount(fn: () => void) {
	const fnRef = useLatest(fn)

	//biome-ignore  lint/correctness/useExhaustiveDependencies: not needed
	useEffect(
		() => () => {
			fnRef.current()
		},
		[],
	)
}
