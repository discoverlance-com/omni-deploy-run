import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import {
	ErrorComponent,
	type ErrorComponentProps,
	Link,
	rootRouteId,
	useMatch,
	useRouter,
} from '@tanstack/react-router'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
} from '@/components/ui/card'

export function DefaultErrorBoundary({ error }: ErrorComponentProps) {
	const router = useRouter()

	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId,
	})

	const queryErrorResetBoundary = useQueryErrorResetBoundary()

	useEffect(() => {
		queryErrorResetBoundary.reset()
	}, [queryErrorResetBoundary])

	return (
		<main className="h-svh grid place-items-center">
			<Card className="mx-auto max-w-sm w-full">
				<CardHeader>
					<h1 className="text-center font-semibold leading-none tracking-tight text-[6rem]">
						Server Error
					</h1>
					<CardDescription className="text-center">
						We apologize for the inconvenience. <br /> Please try again later.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<ErrorComponent error={error} />
				</CardContent>

				<CardFooter className="md:gap-16 sm:gap-8 gap-4 justify-between">
					<Button
						onClick={() => {
							void router.invalidate()
						}}
						variant="outline"
					>
						Try again
					</Button>

					{isRoot ? (
						<Button asChild>
							<Link to="/">Go Home</Link>
						</Button>
					) : (
						<Button asChild>
							<Link
								to="/"
								onClick={(e) => {
									e.preventDefault()
									window.history.back()
								}}
							>
								Go Back
							</Link>
						</Button>
					)}
				</CardFooter>
			</Card>
		</main>
	)
}

export function DashboardErrorBoundary({ error }: ErrorComponentProps) {
	const router = useRouter()

	const queryErrorResetBoundary = useQueryErrorResetBoundary()

	useEffect(() => {
		queryErrorResetBoundary.reset()
	}, [queryErrorResetBoundary])

	return (
		<div className="h-full grid place-items-center">
			<Card className="mx-auto max-w-sm w-full">
				<CardHeader>
					<h1 className="text-center font-semibold leading-none tracking-tight text-[6rem]">
						Server Error
					</h1>
					<CardDescription className="text-center">
						We apologize for the inconvenience. <br /> Please try again later.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<ErrorComponent error={error} />
				</CardContent>

				<CardFooter className="md:gap-16 sm:gap-8 gap-4 justify-between">
					<Button
						onClick={() => {
							void router.invalidate()
						}}
						variant="outline"
					>
						Try again
					</Button>

					<Button asChild>
						<Link
							to="/app"
							onClick={(e) => {
								e.preventDefault()
								window.history.back()
							}}
						>
							Go Back
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
}
