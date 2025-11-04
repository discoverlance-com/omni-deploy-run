import { useLocation } from '@tanstack/react-router'
import { Check, Laptop, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

export function ModeToggle() {
	const { theme, setTheme } = useTheme()
	const location = useLocation()

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="scale-95 rounded-full">
					<Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onSelect={async () => {
						await setTheme({
							data: { theme: 'light', redirectTo: location.pathname },
						})
					}}
				>
					<Sun className="size-4" />
					Light{' '}
					<Check
						size={14}
						className={cn('ms-auto', theme !== 'light' && 'hidden')}
					/>
				</DropdownMenuItem>
				<DropdownMenuItem
					onSelect={async () => {
						await setTheme({
							data: { theme: 'dark', redirectTo: location.pathname },
						})
					}}
				>
					<Moon className="size-4" />
					Dark
					<Check
						size={14}
						className={cn('ms-auto', theme !== 'dark' && 'hidden')}
					/>
				</DropdownMenuItem>
				<DropdownMenuItem
					onSelect={async () => {
						await setTheme({
							data: { theme: 'system', redirectTo: location.pathname },
						})
					}}
				>
					<Laptop className="size-4" />
					System
					<Check
						size={14}
						className={cn('ms-auto', theme !== 'system' && 'hidden')}
					/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
