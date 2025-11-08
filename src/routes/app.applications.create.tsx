import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
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
	FieldDescription,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from '@/components/ui/field'
import { siteInfo } from '@/config/site'
import { createApplication } from '@/database/applications'
import { useAppForm } from '@/lib/form'
import {
	type Application,
	applicationSchema,
	maybeHandleFormZodError,
} from '@/utils/validation'

export const Route = createFileRoute('/app/applications/create')({
	head: () => ({
		meta: [{ title: `Create Application - ${siteInfo.title}` }],
	}),
	component: RouteComponent,
})

const createApplicationSchema = applicationSchema.pick({
	name: true,
	description: true,
	connection_id: true,
	repository: true,
	tags: true,
})

function RouteComponent() {
	const addApplication = useServerFn(createApplication)
	const navigate = Route.useNavigate()

	const form = useAppForm({
		defaultValues: {
			name: '',
			description: undefined,
			tags: [],
			connection_id: '',
			repository: '',
		} as Pick<
			Application,
			'name' | 'description' | 'connection_id' | 'repository' | 'tags'
		>,
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

								<FieldGroup className="grid gap-4 md:grid-cols-2">
									<form.AppField
										name="name"
										children={(field) => {
											return (
												<field.TextField
													labelProps={{ children: 'Name of application *' }}
													inputProps={{
														autoComplete: 'off',
														type: 'text',
														required: true,
													}}
												/>
											)
										}}
									/>

									<form.AppField
										name="description"
										children={(field) => {
											return (
												<field.TextAreaField
													labelProps={{
														children: 'Optional (description for application)',
													}}
													inputProps={{
														autoComplete: 'off',
													}}
												/>
											)
										}}
									/>
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
							<form.SubscribeButton>Save</form.SubscribeButton>
						</form.AppForm>
					</CardFooter>
				</Form>
			</Card>
		</div>
	)
}
