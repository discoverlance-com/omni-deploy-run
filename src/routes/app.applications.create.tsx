import { useStore } from '@tanstack/react-form'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { GlobeIcon, KeyIcon, PlusCircleIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Form } from '@/components/form-components'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardHeading,
	CardTitle,
} from '@/components/ui/card'
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from '@/components/ui/field'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group'
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from '@/components/ui/item'
import { SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { siteInfo } from '@/config/site'
import { createApplication } from '@/database/applications'
import { useAppForm } from '@/lib/form'
import { SUPPORTED_CLOUD_BUILD_LOCATIONS } from '@/utils/cloud-build-locations'
import { SUPPORTED_CLOUD_RUN_MEMORY_OPTIONS } from '@/utils/cloud-run-locations'
import {
	type Application,
	applicationSchema,
	maybeHandleFormZodError,
} from '@/utils/validation'
import {
	connectionQueryOptions,
	linkableRepositiresQueryOptions,
} from './app/connections/-data/query-options'

export const Route = createFileRoute('/app/applications/create')({
	head: () => ({
		meta: [{ title: `Create Application - ${siteInfo.title}` }],
	}),
	async loader({ context }) {
		await context.queryClient.ensureQueryData(connectionQueryOptions())
	},
	component: RouteComponent,
})

const createApplicationSchema = applicationSchema.pick({
	name: true,
	connection_id: true,
	repository: true,
	git_branch: true,
	tags: true,
	region: true,
	allow_public_access: true,
	memory: true,
	number_of_cpus: true,
	environment_variables: true,
})

function RouteComponent() {
	const addApplication = useServerFn(createApplication)
	const navigate = Route.useNavigate()

	const { data: connections } = useSuspenseQuery(connectionQueryOptions())

	const form = useAppForm({
		defaultValues: {
			name: '',
			tags: [] as string[],
			connection_id: '',
			repository: '',
			git_branch: 'main',
			region: 'us-central1',
			allow_public_access: true,
			memory: '512Mi',
			number_of_cpus: '1',
			environment_variables: [] as Application['environment_variables'],
		},
		validators: {
			onSubmit: createApplicationSchema,
		},
		async onSubmit({ value, formApi }) {
			try {
				await addApplication({ data: { ...value } })

				navigate({ to: '/app/applications' })
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
			}
		},
	})

	const connectionId = useStore(
		form.store,
		(state) => state.values.connection_id,
	)

	const {
		data: linkableRepositories,
		isLoading: isLoadingLinkableRepositories,
	} = useQuery(
		linkableRepositiresQueryOptions(
			{ connectionId: connectionId },
			{ enabled: !!connectionId },
		),
	)

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<Card>
				<CardHeader>
					<CardHeading>
						<CardTitle>Create Application</CardTitle>
						<CardDescription>
							Fill in the form below to create a new application
						</CardDescription>
					</CardHeading>
				</CardHeader>
				<Form
					onSubmit={() => {
						void form.handleSubmit()
					}}
				>
					<CardContent>
						<FieldGroup className="gap-4">
							<FieldSet className="border p-4">
								<FieldLegend>Application Details</FieldLegend>
								<FieldDescription>
									Details about the application
								</FieldDescription>

								<FieldGroup className="grid gap-8 md:grid-cols-2">
									<form.AppField
										name="name"
										children={(field) => {
											return (
												<field.TextField
													labelProps={{ children: 'Name *' }}
													inputProps={{
														autoComplete: 'off',
														type: 'text',
														required: true,
													}}
													helperText="The name of the application"
												/>
											)
										}}
									/>

									<form.AppField
										name="connection_id"
										children={(field) => {
											return (
												<field.SelectField
													labelProps={{
														children: 'Connection *',
													}}
													selectInputProps={{
														autoComplete: 'off',
														required: true,
													}}
													helperText="Select a connection to link your repository"
												>
													{connections.connections.map((connection) => {
														return (
															<SelectItem
																key={connection.connectionId}
																value={connection.name}
															>
																{connection.displayName}
															</SelectItem>
														)
													})}
												</field.SelectField>
											)
										}}
									/>

									<form.AppField
										name="repository"
										children={(field) => {
											return (
												<field.SelectField
													labelProps={{
														children: 'Repository *',
													}}
													selectInputProps={{
														autoComplete: 'off',
														required: true,
														disabled:
															!connectionId || isLoadingLinkableRepositories,
													}}
													helperText={
														!connectionId
															? 'Select a connection first'
															: isLoadingLinkableRepositories
																? 'Loading repositories...'
																: 'Select a repository to deploy'
													}
												>
													{isLoadingLinkableRepositories ? (
														<SelectItem value="loading" disabled>
															Please wait, loading repositories...
														</SelectItem>
													) : linkableRepositories &&
														Array.isArray(linkableRepositories) ? (
														linkableRepositories.map((repo) => {
															return (
																<SelectItem
																	key={repo.remoteUri}
																	value={repo.remoteUri || ''}
																>
																	{repo.remoteUri}
																</SelectItem>
															)
														})
													) : null}
												</field.SelectField>
											)
										}}
									/>

									<form.AppField
										name="git_branch"
										children={(field) => {
											return (
												<field.TextField
													labelProps={{ children: 'Git Branch *' }}
													inputProps={{
														autoComplete: 'off',
														type: 'text',
														required: true,
														placeholder: 'main',
													}}
													helperText="The branch to deploy from (e.g., main, develop)"
												/>
											)
										}}
									/>

									<form.AppField
										name="region"
										children={(field) => {
											return (
												<field.SelectField
													labelProps={{
														children: 'Region *',
													}}
													selectInputProps={{
														autoComplete: 'off',
														required: true,
													}}
													helperText="The region the application should be hosted"
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

							<FieldSet className="border p-4">
								<FieldLegend>Application Settings</FieldLegend>
								<FieldDescription>
									Configurations about the application
								</FieldDescription>

								<FieldGroup className="grid gap-8 md:grid-cols-2">
									<form.AppField
										name="allow_public_access"
										children={(field) => {
											return (
												<field.SwitchField
													labelProps={{ children: 'Allow public access *' }}
													switchProps={{}}
													helperText="Expose application publicly or keep it private requiring IAM authentication to access it."
												/>
											)
										}}
									/>

									<form.AppField
										name="memory"
										children={(field) => {
											return (
												<field.SelectField
													labelProps={{
														children: 'Memory *',
													}}
													selectInputProps={{
														autoComplete: 'off',
														required: true,
													}}
													helperText="How much memory to allocate to the application"
												>
													{SUPPORTED_CLOUD_RUN_MEMORY_OPTIONS.map(
														(location) => {
															return (
																<SelectItem
																	key={location.value}
																	value={location.value}
																>
																	{location.label}
																</SelectItem>
															)
														},
													)}
												</field.SelectField>
											)
										}}
									/>

									<form.AppField
										name="number_of_cpus"
										children={(field) => {
											return (
												<field.SelectField
													labelProps={{
														children: 'CPU *',
													}}
													selectInputProps={{
														autoComplete: 'off',
														required: true,
													}}
													helperText="How much CPU to allocate to the application"
												>
													{[1, 2, 4, 6, 8].map((item) => {
														return (
															<SelectItem key={item} value={item.toString()}>
																{item}
															</SelectItem>
														)
													})}
												</field.SelectField>
											)
										}}
									/>
								</FieldGroup>
							</FieldSet>

							<FieldSet className="border p-4">
								<FieldLegend>Environment Variables</FieldLegend>
								<FieldDescription>
									Environment variables to set for the application
								</FieldDescription>

								<FieldGroup>
									<form.Field name="environment_variables" mode="array">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid
											return (
												<div className="space-y-4">
													<Item variant="outline">
														<ItemContent>
															<ItemTitle>
																<FieldLegend
																	variant="label"
																	className="flex items-center flex-wrap"
																>
																	<span>Add Environment Variables</span>
																</FieldLegend>
															</ItemTitle>
															<ItemDescription>
																<span
																	data-slot="field-description"
																	className="text-muted-foreground text-sm leading-normal font-normal group-has-data-[orientation=horizontal]/field:text-balance last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5 [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4"
																>
																	Add environment variables to to your
																	application. Toggle the Secure option to make
																	it a secret which will be stored in secret
																	manager.
																</span>
															</ItemDescription>
														</ItemContent>
														<ItemActions>
															<Button
																type="button"
																variant="outline"
																size="icon"
																onClick={() =>
																	field.pushValue({
																		key: '',
																		value: '',
																		is_secret: false,
																	})
																}
															>
																<PlusCircleIcon />
																<span className="sr-only">
																	Add Environment variable
																</span>
															</Button>
														</ItemActions>
													</Item>

													<div className="space-y-4">
														{field.state.value.map((val, index) => (
															<div
																key={val.key}
																className="flex gap-4 items-center flex-row max-md:flex-wrap"
															>
																<form.Field
																	name={`environment_variables[${index}].key`}
																	children={(subField) => {
																		const isSubFieldInvalid =
																			subField.state.meta.isTouched &&
																			!subField.state.meta.isValid
																		return (
																			<Field
																				orientation="horizontal"
																				data-invalid={isSubFieldInvalid}
																			>
																				<FieldContent>
																					<InputGroup>
																						<form.Subscribe
																							selector={(state) =>
																								state.values
																									.environment_variables[index]
																									.is_secret
																							}
																							children={(v) => {
																								return (
																									<InputGroupAddon align="inline-start">
																										{v ? (
																											<KeyIcon />
																										) : (
																											<GlobeIcon />
																										)}
																									</InputGroupAddon>
																								)
																							}}
																						/>
																						<InputGroupInput
																							id={`form-tanstack-array-variable-key-${index}`}
																							name={subField.name}
																							value={subField.state.value}
																							onBlur={subField.handleBlur}
																							onChange={(e) =>
																								subField.handleChange(
																									e.target.value,
																								)
																							}
																							aria-invalid={isSubFieldInvalid}
																							placeholder="Example: APP_URL"
																							type="text"
																							autoComplete="off"
																						/>
																					</InputGroup>
																					{isSubFieldInvalid && (
																						<FieldError
																							errors={
																								subField.state.meta.errors
																							}
																						/>
																					)}
																				</FieldContent>
																			</Field>
																		)
																	}}
																/>
																<form.Field
																	name={`environment_variables[${index}].value`}
																	children={(subField) => {
																		const isSubFieldInvalid =
																			subField.state.meta.isTouched &&
																			!subField.state.meta.isValid
																		return (
																			<Field
																				orientation="horizontal"
																				data-invalid={isSubFieldInvalid}
																			>
																				<FieldContent>
																					<InputGroup>
																						<InputGroupInput
																							id={`form-tanstack-array-variable-value-${index}`}
																							name={subField.name}
																							value={subField.state.value}
																							onBlur={subField.handleBlur}
																							onChange={(e) =>
																								subField.handleChange(
																									e.target.value,
																								)
																							}
																							aria-invalid={isSubFieldInvalid}
																							placeholder="Example: http://localhost:3000"
																							type="text"
																							autoComplete="off"
																						/>
																						<InputGroupAddon align="inline-end">
																							<InputGroupButton
																								type="button"
																								variant="ghost"
																								size="icon-xs"
																								onClick={() =>
																									field.removeValue(index)
																								}
																								aria-label={`Remove variable ${index + 1}`}
																							>
																								<XIcon />
																							</InputGroupButton>
																						</InputGroupAddon>
																					</InputGroup>
																					{isSubFieldInvalid && (
																						<FieldError
																							errors={
																								subField.state.meta.errors
																							}
																						/>
																					)}
																				</FieldContent>
																			</Field>
																		)
																	}}
																/>
																<form.Field
																	name={`environment_variables[${index}].is_secret`}
																	children={(subField) => {
																		const isSubFieldInvalid =
																			subField.state.meta.isTouched &&
																			!subField.state.meta.isValid
																		return (
																			<Field
																				orientation="horizontal"
																				data-invalid={isSubFieldInvalid}
																				className="w-64"
																			>
																				<Switch
																					id={`form-tanstack-array-secret-${index}`}
																					onCheckedChange={(state) => {
																						subField.handleChange(state)
																					}}
																					onBlur={() => {
																						subField.handleBlur()
																					}}
																					aria-invalid={isSubFieldInvalid}
																					name={subField.name}
																					checked={subField.state.value}
																				/>
																				<FieldContent>
																					<FieldDescription>
																						Is Secret?
																					</FieldDescription>

																					{isSubFieldInvalid && (
																						<FieldError
																							errors={
																								subField.state.meta.errors
																							}
																						/>
																					)}
																				</FieldContent>
																			</Field>
																		)
																	}}
																/>
															</div>
														))}
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() =>
																field.pushValue({
																	key: '',
																	value: '',
																	is_secret: false,
																})
															}
														>
															Add Environment variable
														</Button>
													</div>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</div>
											)
										}}
									</form.Field>
								</FieldGroup>
							</FieldSet>
						</FieldGroup>
					</CardContent>

					<CardFooter className="gap-8">
						<Button variant="outline" type="button" asChild>
							<Link to="/app/applications" viewTransition>
								Cancel
							</Link>
						</Button>
						<form.AppForm>
							<form.SubscribeButton className="flex-1">
								Save
							</form.SubscribeButton>
						</form.AppForm>
					</CardFooter>
				</Form>
			</Card>
		</div>
	)
}
