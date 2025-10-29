import { Link, useLocation } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from '@/components/ui/card'

export const DefaultNotFound = () => {
	const location = useLocation()

	return (
		<div className="h-svh grid place-items-center">
			<Card className="mx-auto max-w-sm w-full shadow-none">
				<CardHeader>
					<h1 className="text-center font-semibold leading-none tracking-tight text-[6rem]">
						404
					</h1>
					<CardDescription className="text-center">
						Sorry! Page Not Found!
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-3">
					<p className="text-center text-muted-foreground text-sm">
						It seems like the page you're looking for <br />
						does not exist or might have been removed.
					</p>
					<pre className="text-center whitespace-pre-wrap break-all text-sm">
						{location.pathname}
					</pre>
				</CardContent>

				<CardFooter className="md:gap-16 sm:gap-8 gap-4 justify-between">
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
				</CardFooter>
			</Card>
		</div>
	)
}

export const DashboardNotFound = () => {
	const location = useLocation()

	return (
		<div className="h-full grid place-items-center">
			<Card className="mx-auto max-w-sm w-full shadow-none">
				<CardHeader>
					<h1 className="font-semibold leading-none tracking-tight text-[6rem] text-center">
						404
					</h1>
					<CardDescription className="text-center">
						Sorry! Page Not Found!
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-3">
					<p className="text-center text-muted-foreground text-sm">
						It seems like the page you're looking for <br />
						does not exist or might have been removed.
					</p>
					<pre className="text-center text-sm whitespace-pre-wrap break-all">
						{location.pathname}
					</pre>
				</CardContent>

				<CardFooter className="md:gap-16 sm:gap-8 gap-4 justify-between">
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
				</CardFooter>
			</Card>
		</div>
	)
}
