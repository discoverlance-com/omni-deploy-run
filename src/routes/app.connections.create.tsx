import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Form } from '@/components/form-components'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	FieldDescription,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from '@/components/ui/field'
import { SelectItem } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { siteInfo } from '@/config/site'
import { useAppForm } from '@/lib/form'
import {
	createGithubConnectionServerFn,
	verifyGithubConnectionServerFn,
} from '@/lib/server-fns/connections'
import { SUPPORTED_CLOUD_BUILD_LOCATIONS } from '@/utils/cloud-build-locations'
import {
	type Connection,
	connectionSchema,
	maybeHandleFormZodError,
} from '@/utils/validation'

export const Route = createFileRoute('/app/connections/create')({
	head: () => ({
		meta: [{ title: `Setup Connection - ${siteInfo.title}` }],
	}),
	component: RouteComponent,
})

const createConnectionSchema = connectionSchema.pick({
	displayName: true,
	location: true,
	type: true,
})

function RouteComponent() {
	const navigate = Route.useNavigate()
	const createGithubConnection = useServerFn(createGithubConnectionServerFn)
	const verifyGithubConnection = useServerFn(verifyGithubConnectionServerFn)

	const [installationState, setInstallationState] = useState<{
		message?: string | null
		actionUri: string
	} | null>(null)

	const [verificationStatus, setVerificationStatus] = useState<{
		status: string
		message: string
	} | null>(null)

	const [isPending, startTransition] = useTransition()

	const handleVerifyConnection = () => {
		startTransition(async () => {
			setVerificationStatus(null)

			try {
				const response = await verifyGithubConnection({
					data: {
						displayName: form.state.values.displayName,
						location: form.state.values.location,
						type: 'github',
					},
				})

				setVerificationStatus({
					status: response.status,
					message: response.message,
				})

				if (response.status === 'ACTIVE') {
					toast.success('Connection successfully verified!')
					setTimeout(() => {
						navigate({ to: '/app/connections' })
					}, 2000)
				}
			} catch (e) {
				toast.error(
					e instanceof Error
						? e.message
						: 'Failed to verify connection. Please try again.',
				)
			}
		})
	}

	const form = useAppForm({
		defaultValues: {
			displayName: '',
			type: 'github',
			location: 'us-central1',
		} as Pick<Connection, 'displayName' | 'type' | 'location'>,
		validators: {
			onSubmit: createConnectionSchema,
		},
		async onSubmit({ value, formApi }) {
			try {
				if (value.type === 'github') {
					const response = await createGithubConnection({
						data: {
							type: 'github',
							location: value.location,
							displayName: value.displayName,
						},
					})
					if (response.installationState) {
						toast.success(
							'Github connection started, please follow the instructions to continue.',
						)

						if (response.installationState.actionUri) {
							setInstallationState({
								actionUri: response.installationState.actionUri,
								message: response.installationState.message,
							})
							return
						}

						if (response.installationState.stage === 'COMPLETE') {
							toast.success(
								'Github connection with this name has already been successfully created!',
							)
							navigate({ to: '/app/connections' })
						}
						return
					}
				}
			} catch (e) {
				const result = maybeHandleFormZodError(e, value, formApi)

				if (!result.handled) {
					toast.error(
						e instanceof Error
							? e.message
							: 'Sorry, an unknown error occured, please try again later',
					)
					return
				}

				console.log(e)
			}
		},
	})

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<Card>
				<CardHeader>
					<CardTitle>Setup Git Connection</CardTitle>
					<CardDescription>
						Fill in the form below to setup a new git connection
					</CardDescription>
				</CardHeader>

				{installationState ? (
					<CardContent className="space-y-4">
						<Alert className="w-full">
							<AlertTitle>Complete GitHub Installation</AlertTitle>
							<AlertDescription className="mt-2 space-y-4">
								<p>
									{installationState.message ??
										'Please log in to https://github.com using your account and then follow this link below to authorize Cloud Build to access that account. After authorization, your GitHub authorization token will be stored in Cloud Secret Manager.'}
								</p>
								<Button asChild>
									<a
										href={installationState.actionUri}
										target="_blank"
										rel="noopener noreferrer"
									>
										Continue to GitHub
									</a>
								</Button>
							</AlertDescription>
						</Alert>

						<div className="space-y-4">
							<Button
								onClick={handleVerifyConnection}
								disabled={isPending}
								variant="outline"
								className="w-full"
							>
								{isPending ? (
									<>
										<Spinner />
										Verifying Connection...
									</>
								) : (
									'Verify Connection Status'
								)}
							</Button>

							{verificationStatus && (
								<Alert
									variant={
										verificationStatus.status === 'ACTIVE'
											? 'default'
											: verificationStatus.status === 'PENDING'
												? 'default'
												: 'destructive'
									}
								>
									<AlertTitle>
										{verificationStatus.status === 'ACTIVE'
											? 'Connection Active'
											: verificationStatus.status === 'PENDING'
												? 'Connection Pending'
												: 'Action Required'}
									</AlertTitle>
									<AlertDescription>
										{verificationStatus.message}
									</AlertDescription>
								</Alert>
							)}
						</div>
					</CardContent>
				) : (
					<Form
						onSubmit={() => {
							void form.handleSubmit()
						}}
					>
						<CardContent>
							<FieldGroup className="gap-4">
								<FieldSet className="border p-4">
									<FieldLegend>Connection Details</FieldLegend>
									<FieldDescription>
										Details about the git connection
									</FieldDescription>

									<FieldGroup className="grid gap-4 md:grid-cols-2">
										<form.AppField
											name="displayName"
											children={(field) => {
												return (
													<field.TextField
														labelProps={{
															children: 'Name of the connection *',
														}}
														inputProps={{
															autoComplete: 'off',
															type: 'text',
															required: true,
															maxLength: 20,
														}}
													/>
												)
											}}
										/>
										<form.AppField
											name="location"
											children={(field) => {
												return (
													<field.SelectField
														labelProps={{
															children: 'Name of the connection *',
														}}
														selectInputProps={{
															autoComplete: 'off',
															required: true,
														}}
													>
														{SUPPORTED_CLOUD_BUILD_LOCATIONS.map((location) => {
															return (
																<SelectItem
																	key={location.value}
																	value={location.value}
																>
																	{location.label}
																</SelectItem>
															)
														})}
													</field.SelectField>
												)
											}}
										/>
									</FieldGroup>
								</FieldSet>
							</FieldGroup>
						</CardContent>

						<CardFooter className="mt-8 gap-8">
							<Button variant="outline" type="button" asChild>
								<Link to="/app/connections" viewTransition>
									Cancel
								</Link>
							</Button>
							<form.AppForm>
								<form.SubscribeButton className="flex-1">
									Setup Github Connection
								</form.SubscribeButton>
							</form.AppForm>
						</CardFooter>
					</Form>
				)}
			</Card>
		</div>
	)
}
