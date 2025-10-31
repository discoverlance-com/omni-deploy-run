import { useStore } from '@tanstack/react-form'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AtSignIcon, KeyIcon, KeyRoundIcon } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import z from 'zod/v4'

import { FloatingPaths } from '@/components/floating-paths'
import { Form } from '@/components/form-components'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { siteInfo } from '@/config/site'
import { getOnboarding } from '@/database/onboarding'
import { authClient, signIn } from '@/lib/auth-client'
import { useAppForm } from '@/lib/form'
import { safeRedirect } from '@/lib/safe-redirect'
import { requireAnonymousUser } from '@/utils/auth'

const searchParams = z.object({
	callbackUrl: z
		.string()
		.default('/app')
		.catch('/app')
		.transform((v) => safeRedirect(v, '/app')),
})

export const Route = createFileRoute('/')({
	validateSearch: searchParams,
	head: () => ({
		meta: [{ title: `Signin - ${siteInfo.title}` }],
	}),
	async beforeLoad() {
		await requireAnonymousUser()

		// make sure user onboards
		const onboarding = await getOnboarding()

		if (onboarding) {
			if (!onboarding.is_app_setup_complete) {
				throw redirect({ to: '/onboarding' })
			}
		} else {
			throw redirect({ to: '/onboarding' })
		}
	},
	component: App,
})

const loginFormSchema = z.object({
	email: z
		.email({ message: 'Email must be a valid email address' })
		.min(1, 'Email is required'),
	password: z.string().min(1, 'Password is required'),
	rememberMe: z.boolean(),
})

function App() {
	const navigate = Route.useNavigate()
	const [isPendingTransition, startTransition] = useTransition()
	const search = Route.useSearch()

	const form = useAppForm({
		validators: {
			onSubmit: loginFormSchema,
		},
		defaultValues: {
			email: '',
			password: '',
			rememberMe: false,
		},
		async onSubmit({ value }) {
			await signIn.email({
				email: value.email,
				password: value.password,
				rememberMe: value.rememberMe,
				callbackURL: search.callbackUrl,
				fetchOptions: {
					onSuccess(ctx) {
						toast.success(
							`Welcome to ${siteInfo.title} with Firebase, ${ctx.data?.user?.name}`,
						)
						navigate({ to: '/app' })
					},
					onError: ({ error }) => {
						toast.error(error.message || 'An error occurred')
					},
				},
			})
		},
	})

	console.log({ form: form.getAllErrors() })

	const isFormSubmitting = useStore(form.store, (state) => state.isSubmitting)

	async function handleSignInWithPasskey() {
		startTransition(async () => {
			await authClient.signIn.passkey({
				fetchOptions: {
					onSuccess(ctx) {
						toast.success(
							`Welcome to ${siteInfo.title} with Firebase, ${ctx.data?.user?.name}`,
						)
						navigate({ to: '/app' })
					},
					onError: ({ error }) => {
						toast.error(error.message || 'An error occurred')
					},
				},
			})
		})
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
						<h1 className="font-bold text-2xl tracking-wide">Sign In</h1>
						<p className="text-base text-muted-foreground">
							login to your account.
						</p>
					</div>

					<Form
						onSubmit={() => {
							void form.handleSubmit()
						}}
					>
						<div className="space-y-2 mb-4">
							<Button
								className="w-full relative"
								size="lg"
								type="button"
								onClick={handleSignInWithPasskey}
								disabled={isPendingTransition || isFormSubmitting}
							>
								{isPendingTransition ? <Spinner /> : <KeyIcon size={16} />}
								Continue with Passkey
								{authClient.isLastUsedLoginMethod('passkey') && (
									<LastUsedIndicator />
								)}
							</Button>
						</div>

						<div className="flex w-full items-center justify-center mb-4">
							<div className="h-px w-full bg-border" />
							<span className="px-2 text-muted-foreground text-xs">OR</span>
							<div className="h-px w-full bg-border" />
						</div>
						<p className="text-start text-muted-foreground text-xs mb-2">
							Sign in with your email address
						</p>
						<FieldGroup className="gap-4">
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
															required
															autoComplete="email webauthn"
															id={props.id}
															name={field.name}
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
															autoComplete="current-password webauthn"
															id={props.id}
															name={field.name}
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

							<form.AppField
								name="rememberMe"
								children={(field) => {
									return (
										<field.CheckboxField
											labelProps={{
												children: 'Remember Me',
												className: 'font-normal',
											}}
											checkboxProps={{}}
										/>
									)
								}}
							/>
						</FieldGroup>

						<form.AppForm>
							<form.SubscribeButton className="mt-4 w-full relative">
								Continue With Email{' '}
								{authClient.isLastUsedLoginMethod('email') && (
									<LastUsedIndicator />
								)}
							</form.SubscribeButton>
						</form.AppForm>
					</Form>
				</div>
			</div>
		</main>
	)
}

const LastUsedIndicator = () => (
	<span className="ml-auto absolute top-0 right-0 px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md font-medium">
		Last Used
	</span>
)
