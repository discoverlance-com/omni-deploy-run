import { debounce } from 'es-toolkit'
import { useMemo } from 'react'

import { useLatest } from '@/hooks/use-latest'
import { useUnmount } from '@/hooks/use-unmount'

interface DebounceOptions {
	/**
	 * An optional AbortSignal to cancel the debounced function.
	 */
	signal?: AbortSignal
	/**
	 * An optional array specifying whether the function should be invoked on the leading edge, trailing edge, or both.
	 * If `edges` includes "leading", the function will be invoked at the start of the delay period.
	 * If `edges` includes "trailing", the function will be invoked at the end of the delay period.
	 * If both "leading" and "trailing" are included, the function will be invoked at both the start and end of the delay period.
	 * @default ["trailing"]
	 */
	edges?: Array<'leading' | 'trailing'>
}

//biome-ignore  lint/suspicious/noExplicitAny: it's ok
export function useDebounceFn<Fn extends (...args: any[]) => any>(
	fn: Fn,
	debounceMs?: number,
	options?: DebounceOptions,
) {
	const fnRef = useLatest(fn)

	//biome-ignore  lint/correctness/useExhaustiveDependencies: not needed
	const debouncedFn = useMemo(
		() =>
			debounce(
				(...args: Parameters<Fn>) => fnRef.current(...args),
				debounceMs ?? 1000,
				options,
			),
		[],
	)

	useUnmount(() => debouncedFn.cancel())

	return {
		run: debouncedFn,
		cancel: debouncedFn.cancel,
		flush: debouncedFn.flush,
	}
}
