import { createFileRoute, Outlet } from '@tanstack/react-router'

import { AppSidebar } from '@/components/app-sidebar'
import { DashboardErrorBoundary } from '@/components/layout/error-boundary'
import { DashboardNotFound } from '@/components/layout/not-found'
import { SiteHeader } from '@/components/layout/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
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
		<div className="[--header-height:calc(--spacing(14))]">
			<SidebarProvider className="flex flex-col">
				<SiteHeader />
				<div className="flex flex-1">
					<AppSidebar />
					<SidebarInset>
						<Outlet />
					</SidebarInset>
				</div>
			</SidebarProvider>
		</div>
	)
}
