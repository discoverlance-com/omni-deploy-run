import { useRouterState } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSpinDelay } from 'spin-delay'

import { cn } from '@/lib/utils'

export function GlobalLoadingProgress() {
	const transition = useRouterState({
		select: (s) => s.status,
	})

	const busy = transition === 'pending'
	const delayedPending = useSpinDelay(busy, {
		delay: 600,
		minDuration: 400,
	})
	const ref = useRef<HTMLDivElement>(null)
	const [animationComplete, setAnimationComplete] = useState(true)

	useEffect(() => {
		if (!ref.current) return
		if (delayedPending) setAnimationComplete(false)

		const animationPromises = ref.current
			.getAnimations()
			.map(({ finished }) => finished)

		void Promise.allSettled(animationPromises).then(() => {
			if (!delayedPending) setAnimationComplete(true)
		})
	}, [delayedPending])

	return (
		<div
			role="progressbar"
			aria-hidden={delayedPending ? undefined : true}
			aria-valuetext={delayedPending ? 'Loading' : undefined}
			className="fixed inset-x-0 left-0 top-0 z-50 h-[0.20rem] animate-pulse [view-transition-name:epic-progress]"
		>
			<div
				ref={ref}
				className={cn(
					'h-full w-0 bg-foreground duration-500 ease-in-out',
					transition === 'idle' &&
						(animationComplete
							? 'transition-none'
							: 'w-full opacity-0 transition-all'),
					delayedPending && transition === 'pending' && 'w-5/12',
				)}
			/>
			{delayedPending && (
				<div className="absolute flex items-center justify-center">
					<Loader2Icon
						name="update"
						className="m-1 animate-spin text-foreground h-6 w-6"
						aria-hidden
					/>
				</div>
			)}
		</div>
	)
}
