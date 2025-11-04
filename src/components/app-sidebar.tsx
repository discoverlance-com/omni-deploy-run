import { Link } from '@tanstack/react-router'
import {
	AppWindowIcon,
	FolderIcon,
	Home,
	LinkIcon,
	RocketIcon,
	Settings2,
} from 'lucide-react'
import type * as React from 'react'

import { NavMain } from '@/components/layout/nav-main'
import { NavProjects } from '@/components/layout/nav-projects'
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { siteInfo } from '@/config/site'

const data = {
	navMain: [
		{
			title: 'Dashboard',
			url: '/app',
			icon: Home,
		},
		{
			title: 'Applications',
			url: '/app/applications',
			icon: AppWindowIcon,
		},
		{
			title: 'Connections',
			url: '/app/connections',
			icon: LinkIcon,
		},
		{
			title: 'Settings',
			url: '/app/settings',
			icon: Settings2,
		},
	],
	projects: [
		{
			name: 'Design Engineering',
			url: '#',
		},
		{
			name: 'Sales & Marketing',
			url: '#',
		},
		{
			name: 'Travel',
			url: '#',
		},
	],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar
			className="top-(--header-height) h-[calc(100svh-var(--header-height))]! [view-transition-name:'app-sidebar']"
			{...props}
		>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link to="/app">
								<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
									<RocketIcon className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{siteInfo.title}</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavProjects projects={data.projects} />
			</SidebarContent>
		</Sidebar>
	)
}
