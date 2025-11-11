import { useNavigate } from '@tanstack/react-router'
import { LogOutIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut, useSession } from '@/lib/auth-client'
import { Button } from '../ui/button'

export function UserProfileDropdown() {
	const { data } = useSession()
	const navigate = useNavigate()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon">
					<Avatar className="rounded-lg">
						<AvatarImage src={data?.user.image ?? ''} alt={data?.user.name} />
						<AvatarFallback className="uppercase">
							{(
								data?.user.name.trim().split(/\s+/)[0][0] +
								(data?.user.name.trim().split(/\s+/)[1]?.[0] ??
									data?.user.name.trim().split(/\s+/)[0][1] ??
									'')
							).toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{/* <DropdownMenuItem asChild className="cursor-pointer">
					<Link to="/app/profile">
						<UserIcon />
						<span>Profile</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem className="cursor-pointer" asChild>
					<Link to="/app/settings">
						<Settings2 />
						<span>Settings</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator /> */}
				<DropdownMenuItem
					onSelect={async () => {
						await signOut()
						await navigate({ to: '/' })
					}}
					className="cursor-pointer"
				>
					<LogOutIcon /> Logout
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
