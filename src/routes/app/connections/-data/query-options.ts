import { queryOptions } from '@tanstack/react-query'

import { getAllConnectionsServerFn } from '@/lib/server-fns/connections'

export const getConnectionQueryKey = () => ['connections']

export const connectionQueryOptions = () =>
	queryOptions({
		queryKey: getConnectionQueryKey(),
		queryFn: () => getAllConnectionsServerFn(),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	})
