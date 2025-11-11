import { Link, useLocation } from '@tanstack/react-router'
import { FileXIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty'

export const DefaultNotFound = () => {
	const location = useLocation()

	return (
		<div className="h-svh grid place-items-center">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FileXIcon />
					</EmptyMedia>
					<EmptyTitle className="font-bold text-8xl">404</EmptyTitle>
					<EmptyDescription className="text-nowrap">
						The page you're looking for might have been <br />
						moved or doesn't exist.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<pre className="text-center whitespace-pre-wrap break-all text-sm">
						{location.pathname}
					</pre>
					<div className="flex gap-8">
						<Button
							onClick={() => {
								window.history.back()
							}}
						>
							Go Back
						</Button>
						<Button asChild variant="outline">
							<Link to="/" viewTransition>
								Go Home
							</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	)
}

export const DashboardNotFound = ({ message }: { message?: string }) => {
	const location = useLocation()

	return (
		<div className="h-full grid place-items-center">
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FileXIcon />
					</EmptyMedia>
					<EmptyTitle className="font-bold text-8xl">404</EmptyTitle>
					<EmptyDescription className="text-nowrap">
						{message ??
							"The page you're looking for might have been moved or doesn't exist."}
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<pre className="text-center whitespace-pre-wrap break-all text-sm">
						{location.pathname}
					</pre>
					<div className="flex gap-8">
						<Button
							onClick={() => {
								window.history.back()
							}}
						>
							Go Back
						</Button>
						<Button asChild variant="outline">
							<Link to="/app" viewTransition>
								Go Home
							</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	)
}
