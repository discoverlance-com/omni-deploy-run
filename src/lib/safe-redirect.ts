const DEFAULT_REDIRECT = '/'

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 * @license MIT
 * @author https://github.com/jacob-ebey
 */
export function safeRedirect(
	to: FormDataEntryValue | string | null | undefined,
	defaultRedirect: string = DEFAULT_REDIRECT,
) {
	if (!to || typeof to !== 'string') return defaultRedirect

	const trimmedTo = to.trim()

	// Block absolute URLs (e.g., /example.com)
	const absoluteUrlPattern = /^\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/
	if (absoluteUrlPattern.test(trimmedTo)) {
		return defaultRedirect // Block any path like /example.com
	}

	// Block absolute URLs (contains "://") or any URLs that start with a protocol
	if (
		trimmedTo.startsWith('www.') ||
		trimmedTo.startsWith('http://') ||
		trimmedTo.startsWith('https://')
	) {
		return defaultRedirect // Block absolute URLs
	}

	if (
		!trimmedTo.startsWith('/') ||
		trimmedTo.startsWith('//') ||
		trimmedTo.startsWith('/\\') ||
		trimmedTo.includes('..') ||
		trimmedTo.includes('://') // Block any URL with a protocol (e.g., http://)
	) {
		return defaultRedirect
	}

	return trimmedTo
}
