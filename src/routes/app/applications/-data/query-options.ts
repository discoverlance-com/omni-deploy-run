import { queryOptions } from '@tanstack/react-query'

import { getApplications } from '@/database/applications'

export const getApplicationsQueryKey = () => ['applications']

export const applicationsQueryOptions = () =>
	queryOptions({
		queryKey: getApplicationsQueryKey(),
		queryFn: () => getApplications(),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	})
