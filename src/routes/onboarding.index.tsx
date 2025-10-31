import { createFileRoute, redirect } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { AtSignIcon, KeyRoundIcon, UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import type z from 'zod/v4'

import { FloatingPaths } from '@/components/floating-paths'
import { Form } from '@/components/form-components'
import { Logo } from '@/components/shared/logo'
import {
	FieldDescription,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from '@/components/ui/field'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { siteInfo } from '@/config/site'
import { getOnboarding } from '@/database/onboarding'
import { useAppForm } from '@/lib/form'
import { handleUserOnboardingForm } from '@/lib/server-fns/onboarding'
import { requireAnonymousUser } from '@/utils/auth'
import { onboardingFormSchema } from '@/utils/validation'

export const Route = createFileRoute('/onboarding/')({
	head: () => ({
		meta: [{ title: `Onboarding - ${siteInfo.title}` }],
	}),
	async beforeLoad() {
		await requireAnonymousUser()

		// verify that user is onboarded
		const onboarding = await getOnboarding()

		if (onboarding) {
			if (onboarding.is_app_setup_complete) {
				throw redirect({ to: '/' })
			}
		}
	},
	component: App,
})

function App() {
	const navigate = Route.useNavigate()

	const userOnboarding = useServerFn(handleUserOnboardingForm)

	const form = useAppForm({
		validators: {
			onSubmit: onboardingFormSchema,
		},
		defaultValues: {
			email: '',
			password: '',
			name: '',
		},
		onSubmit: async ({ value }) => {
			await handleFormSubmission(value)
		},
	})

	const handleFormSubmission = async (
		value: z.infer<typeof onboardingFormSchema>,
	) => {
		try {
			await userOnboarding({ data: { ...value } })
			toast.success('Setup has been completed successfully!', {
				description: 'Please proceed to login',
			})
			navigate({ to: '/' })
		} catch (err) {
			toast.error((err as Error).message)
		}
	}

	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
			<div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
				<div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
				<Logo className="mr-auto h-6" />
				<div className="absolute inset-0">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>

				<div className="z-10 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-xl">&ldquo;{siteInfo.description}&rdquo;</p>
						<footer className="font-mono font-semibold text-sm">
							~ {siteInfo.title}
						</footer>
					</blockquote>
				</div>
			</div>
			<div className="relative flex min-h-screen flex-col justify-center p-4">
				<div
					aria-hidden
					className="-z-10 absolute inset-0 isolate opacity-60 contain-strict"
				>
					<div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-140 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
					<div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
					<div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
				</div>
				<div className="mx-auto space-y-4 sm:w-sm">
					<Logo className="h-6 lg:hidden" />
					<div className="flex flex-col space-y-1">
						<h1 className="font-bold text-2xl tracking-wide">Onboarding</h1>
						<p className="text-base text-muted-foreground">
							setup initial access and account
						</p>
					</div>

					<Form
						onSubmit={() => {
							void form.handleSubmit()
						}}
					>
						<FieldGroup>
							<FieldSet>
								<FieldLegend>User information</FieldLegend>
								<FieldDescription>
									User information will be used to setup your initial account.
								</FieldDescription>

								<FieldGroup className="gap-4">
									<form.AppField
										name="name"
										children={(field) => {
											return (
												<field.CustomField
													labelProps={{}}
													children={(props) => {
														return (
															<InputGroup>
																<InputGroupInput
																	placeholder="Your full name"
																	type="text"
																	required
																	name={field.name}
																	autoComplete="name"
																	id={props.id}
																	onChange={(e) => {
																		field.handleChange(e.target.value)
																	}}
																	value={field.state.value}
																	onBlur={field.handleBlur}
																	aria-describedby={props['aria-describedby']}
																	aria-invalid={props['aria-invalid']}
																/>
																<InputGroupAddon align="inline-start">
																	<UserIcon />
																</InputGroupAddon>
															</InputGroup>
														)
													}}
												/>
											)
										}}
									/>

									<form.AppField
										name="email"
										children={(field) => {
											return (
												<field.CustomField
													labelProps={{}}
													children={(props) => {
														return (
															<InputGroup>
																<InputGroupInput
																	placeholder="your.email@example.com"
																	type="email"
																	name={field.name}
																	required
																	autoComplete="email"
																	id={props.id}
																	onChange={(e) => {
																		field.handleChange(e.target.value)
																	}}
																	value={field.state.value}
																	onBlur={field.handleBlur}
																	aria-describedby={props['aria-describedby']}
																	aria-invalid={props['aria-invalid']}
																/>
																<InputGroupAddon align="inline-start">
																	<AtSignIcon />
																</InputGroupAddon>
															</InputGroup>
														)
													}}
												/>
											)
										}}
									/>

									<form.AppField
										name="password"
										children={(field) => {
											return (
												<field.CustomField
													labelProps={{}}
													children={(props) => {
														return (
															<InputGroup>
																<InputGroupAddon align="inline-start">
																	<KeyRoundIcon />
																</InputGroupAddon>
																<InputGroupInput
																	placeholder="Your password"
																	type="password"
																	autoComplete="new-password"
																	id={props.id}
																	onChange={(e) => {
																		field.handleChange(e.target.value)
																	}}
																	onBlur={field.handleBlur}
																	value={field.state.value}
																	aria-describedby={props['aria-describedby']}
																	aria-invalid={props['aria-invalid']}
																/>
															</InputGroup>
														)
													}}
												/>
											)
										}}
									/>
								</FieldGroup>
							</FieldSet>
						</FieldGroup>

						<form.AppForm>
							<form.SubscribeButton className="mt-4 w-full relative">
								Setup Account
							</form.SubscribeButton>
						</form.AppForm>
					</Form>
				</div>
			</div>
		</main>
	)
}
