import { queryOptions } from '@tanstack/react-query'

import { getAllConnectionsServerFn } from '@/lib/server-fns/connections'

export const getConnectionQueryKey = (location?: string) => [
	'connections',
	location || 'default',
]

export const connectionQueryOptions = (location?: string) =>
	queryOptions({
		queryKey: getConnectionQueryKey(location),
		queryFn: () => getAllConnectionsServerFn({ data: { location } }),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	})
