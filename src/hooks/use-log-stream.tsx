import { useEffect, useRef, useState } from 'react'

export interface LogEntry {
	type: 'connection' | 'log' | 'history_complete' | 'stream_end' | 'error'
	timestamp: string
	severity?: string
	message: string
	insertId?: string
	resource?: unknown
}

export interface LogStreamState {
	logs: LogEntry[]
	connectionState: 'connecting' | 'connected' | 'disconnected' | 'error'
	error: string | null
}

export function useLogStream(
	applicationId: string,
	buildId: string,
): LogStreamState & { refresh: () => void } {
	const [logs, setLogs] = useState<LogEntry[]>([])
	const [connectionState, setConnectionState] = useState<
		'connecting' | 'connected' | 'disconnected' | 'error'
	>('connecting')
	const [error, setError] = useState<string | null>(null)
	const [refreshTrigger, setRefreshTrigger] = useState(0)
	const eventSourceRef = useRef<EventSource | null>(null)
	const isEndedRef = useRef<boolean>(false)

	const refresh = () => {
		setRefreshTrigger((prev) => prev + 1)
	}

	//biome-ignore lint/correctness/useExhaustiveDependencies: not needed
	useEffect(() => {
		if (!buildId || !applicationId) {
			setConnectionState('error')
			setError('Missing build ID or application ID')
			return
		}

		// Clean up previous connection
		if (eventSourceRef.current) {
			eventSourceRef.current.close()
			eventSourceRef.current = null
		}

		// Reset state
		setLogs([])
		setConnectionState('connecting')
		setError(null)
		isEndedRef.current = false

		// Create EventSource
		const eventSource = new EventSource(
			`/api/logs/${applicationId}/builds/${buildId}`,
		)
		eventSourceRef.current = eventSource

		eventSource.onopen = () => {
			setConnectionState('connected')
		}

		eventSource.onmessage = (event) => {
			try {
				const logEntry: LogEntry = JSON.parse(event.data)

				setLogs((prev) => [...prev, logEntry])

				if (logEntry.type === 'stream_end') {
					isEndedRef.current = true
					setConnectionState('disconnected')
					eventSource.close()
				} else if (logEntry.type === 'error') {
					setError(logEntry.message)
					setConnectionState('error')
					eventSource.close()
				}
			} catch (err) {
				console.error('Error parsing log:', err)
				setError('Error parsing log data')
				setConnectionState('error')
			}
		}

		eventSource.onerror = () => {
			// Only treat as error if we haven't received stream_end
			if (!isEndedRef.current) {
				setConnectionState('error')
				setError('Connection error')
			}
			eventSource.close()
		}

		// Cleanup
		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
				eventSourceRef.current = null
			}
		}
	}, [applicationId, buildId, refreshTrigger])

	return {
		logs,
		connectionState,
		error,
		refresh,
	}
}
