import { useRef } from 'react'

/**
 * useStableValue
 *
 * Accepts a value and captures it only once (on first render).
 * Even if the input value changes, the stored value remains constant.
 */
export function useStableValue<T>(value: T): T {
	const ref = useRef<T>(value)

	// Do not update ref on re-render — it's intentionally "frozen"
	return ref.current
}
