import { createFileRoute, Outlet } from '@tanstack/react-router'

import { DashboardErrorBoundary } from '@/components/layout/error-boundary'
import { DashboardNotFound } from '@/components/layout/not-found'
import { requireAuthentedUser } from '@/utils/auth'

export const Route = createFileRoute('/app')({
	async beforeLoad() {
		await requireAuthentedUser()
	},
	component: RouteComponent,
	notFoundComponent: () => {
		return <DashboardNotFound />
	},
	errorComponent: (props) => {
		return <DashboardErrorBoundary {...props} />
	},
})

function RouteComponent() {
	return (
		<div>
			Hello "/app"!
			<Outlet />
		</div>
	)
}
