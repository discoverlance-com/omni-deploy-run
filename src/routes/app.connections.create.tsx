import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Form } from '@/components/form-components'
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
import { siteInfo } from '@/config/site'
import { useAppForm } from '@/lib/form'
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
	name: true,
	description: true,
	type: true,
})

function RouteComponent() {
	const navigate = Route.useNavigate()

	const form = useAppForm({
		defaultValues: {
			name: '',
			description: undefined,
			type: 'github',
		} as Pick<Connection, 'name' | 'description' | 'type'>,
		validators: {
			onSubmit: createConnectionSchema,
		},
		async onSubmit({ value, formApi }) {
			try {
				navigate({ to: '/app/connections' })
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
					<CardTitle>Setup Git Connection</CardTitle>
					<CardDescription>
						Fill in the form below to setup a new git connection
					</CardDescription>
				</CardHeader>
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
										name="name"
										children={(field) => {
											return (
												<field.TextField
													labelProps={{ children: 'Name of the connection *' }}
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
														children: 'Optional (description for connection)',
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

					<CardFooter className="pt-6 gap-8">
						<Button variant="outline" type="button" asChild>
							<Link to="/app/connections" viewTransition>
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
