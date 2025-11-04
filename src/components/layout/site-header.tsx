import { Link } from '@tanstack/react-router'
import { SidebarIcon } from 'lucide-react'

import { UserProfileDropdown } from '@/components/layout/user-profile-dropdown'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'
import { siteInfo } from '@/config/site'
import { ModeToggle } from '../mode-toggle'

export function SiteHeader() {
	const { toggleSidebar } = useSidebar()

	return (
		<header className="bg-background sticky top-0 z-50 flex w-full items-center border-b  [view-transition-name:'app-sidebar-header']">
			<div className="flex h-(--header-height) w-full items-center gap-2 px-4">
				<Button
					className="h-8 w-8"
					variant="ghost"
					size="icon"
					onClick={toggleSidebar}
				>
					<SidebarIcon />
				</Button>
				<Separator orientation="vertical" className="mr-2 h-4" />
				<Breadcrumb className="hidden sm:block">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/app">Dashboard</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{siteInfo.title}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="w-full sm:ml-auto sm:w-auto space-x-4">
					<ModeToggle />
					<UserProfileDropdown />
				</div>
			</div>
		</header>
	)
}
