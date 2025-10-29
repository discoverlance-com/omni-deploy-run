import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import {
	ErrorComponent,
	type ErrorComponentProps,
	Link,
	rootRouteId,
	useMatch,
	useRouter,
} from '@tanstack/react-router'
import { ServerCrashIcon } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty'

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
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ServerCrashIcon />
					</EmptyMedia>
					<EmptyTitle className="font-bold text-2xl">Server Error</EmptyTitle>
					<EmptyDescription className="text-nowrap">
						We apologize for the inconvenience. <br /> Please try again later.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<ErrorComponent error={error} />
					<div className="flex gap-8">
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
					</div>
				</EmptyContent>
			</Empty>
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
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ServerCrashIcon />
					</EmptyMedia>
					<EmptyTitle className="font-bold text-2xl">Server Error</EmptyTitle>
					<EmptyDescription className="text-nowrap">
						We apologize for the inconvenience. <br /> Please try again later.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<ErrorComponent error={error} />
					<div className="flex gap-8">
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
					</div>
				</EmptyContent>
			</Empty>
		</div>
	)
}
