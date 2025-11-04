import { useRef } from 'react'

/**
 * React hook that computes a derived value from an input only once (on initial render).
 *
 * The `derive` function is called with the initial `value` and its result is cached.
 * Subsequent renders will return the cached result, even if `value` changes.
 *
 * @template T - The type of the input value.
 * @template R - The type of the derived result.
 * @param {T} value - The input value to derive from (used only on first render).
 * @param {(v: T) => R} derive - Function to compute the derived value from the input.
 * @returns {R} The derived value, computed only once.
 */
export function useDerivedOnce<T, R>(value: T, derive: (v: T) => R): R {
	const ref = useRef<R>(undefined)

	if (ref.current === undefined) {
		ref.current = derive(value)
	}

	return ref.current
}
