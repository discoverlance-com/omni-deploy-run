import { queryOptions } from '@tanstack/react-query'

import { getAllConnectionsServerFn } from '@/lib/server-fns/connections'
import { getAllLinkableRepositoriesServerFn } from '@/lib/server-fns/repositories'

export const getConnectionQueryKey = () => ['connections']

export const connectionQueryOptions = () =>
	queryOptions({
		queryKey: getConnectionQueryKey(),
		queryFn: () => getAllConnectionsServerFn(),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	})

export const linkableRepositiresQueryOptions = (
	data: Parameters<typeof getAllLinkableRepositoriesServerFn>['0']['data'],
	options?: Omit<Parameters<typeof queryOptions>['0'], 'queryKey' | 'queryFn'>,
) =>
	queryOptions({
		queryKey: ['linkable-repositories', data.connectionId],
		queryFn: () => getAllLinkableRepositoriesServerFn({ data }),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
		...options,
	})
