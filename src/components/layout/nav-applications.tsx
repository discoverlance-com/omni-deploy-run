import { Link, useLocation } from '@tanstack/react-router'
import {
	Briefcase,
	Folder,
	type LucideIcon,
	MoreHorizontal,
	Trash2,
} from 'lucide-react'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar'

export function NavApplications({
	applications,
}: {
	applications: {
		name: string
		url: string
		icon?: LucideIcon
	}[]
}) {
	const { isMobile } = useSidebar()
	const location = useLocation()

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>List of Applications</SidebarGroupLabel>
			<SidebarMenu>
				{applications.length === 0 ? (
					<SidebarMenuItem>
						<SidebarMenuButton className="text-muted-foreground">
							<span>No applications added yet</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				) : (
					applications.map((item) => (
						<SidebarMenuItem key={item.name}>
							<SidebarMenuButton
								asChild
								isActive={item.url === location.pathname}
							>
								<Link to={item.url} viewTransition>
									<Briefcase />
									<span>{item.name}</span>
								</Link>
							</SidebarMenuButton>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuAction showOnHover>
										<MoreHorizontal />
										<span className="sr-only">More</span>
									</SidebarMenuAction>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-48"
									side={isMobile ? 'bottom' : 'right'}
									align={isMobile ? 'end' : 'start'}
								>
									<DropdownMenuItem>
										<Folder className="text-muted-foreground" />
										<span>View Project</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem>
										<Trash2 className="text-muted-foreground" />
										<span>Delete Project</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					))
				)}
			</SidebarMenu>
		</SidebarGroup>
	)
}
