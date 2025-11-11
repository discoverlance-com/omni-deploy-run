import { getRouteApi } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'

import { Form } from '@/components/form-components'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	FieldDescription,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from '@/components/ui/field'
import { SelectItem } from '@/components/ui/select'
import { updateApplication } from '@/database/applications'
import { useAppForm } from '@/lib/form'
import { updateCloudBuildTriggerServerFn } from '@/lib/server-fns/cloud-build'
import { applicationsQueryOptions } from '@/routes/app/applications/-data/query-options'
import { SUPPORTED_CLOUD_RUN_MEMORY_OPTIONS } from '@/utils/cloud-run-locations'
import {
	type Application,
	applicationSchema,
	maybeHandleFormZodError,
} from '@/utils/validation'

const CPU_OPTIONS = [
	{ label: '1 CPU', value: '1' },
	{ label: '2 CPUs', value: '2' },
	{ label: '4 CPUs', value: '4' },
	{ label: '8 CPUs', value: '8' },
]

const updateApplicationSettingsSchema = applicationSchema.pick({
	memory: true,
	number_of_cpus: true,
	allow_public_access: true,
	port: true,
})

interface ApplicationSettingsDialogProps {
	trigger: React.ReactNode
	application: Application
}

const routeApi = getRouteApi('/app/applications/$applicationId')

export function ApplicationSettingsDialog({
	trigger,
	application,
}: ApplicationSettingsDialogProps) {
	const updateApplicationFn = useServerFn(updateApplication)
	const updateTriggerFn = useServerFn(updateCloudBuildTriggerServerFn)
	const [open, setOpen] = useState(false)

	const navigate = routeApi.useNavigate()
	const queryClient = routeApi.useRouteContext({
		select: (options) => options.queryClient,
	})

	const form = useAppForm({
		defaultValues: {
			memory: application.memory,
			number_of_cpus: application.number_of_cpus,
			allow_public_access: application.allow_public_access,
			port: application.port,
		},
		validators: {
			onSubmit: updateApplicationSettingsSchema,
		},
		async onSubmit({ value, formApi }) {
			try {
				// Update the Cloud Build trigger with new settings
				if (application.trigger_details?.id) {
					await updateTriggerFn({
						data: {
							trigger: {
								triggerId: application.trigger_details.id,
								location: application.region,
								name: application.trigger_details.name ?? '',
							},
							...value,
						},
					})
				}

				// Update the application record in Firestore
				await updateApplicationFn({
					data: {
						id: application.id ?? '',
						...value,
					},
				})

				toast.success('Application settings updated successfully')

				await queryClient.invalidateQueries(applicationsQueryOptions())
				formApi.reset()
				setOpen(false)

				await navigate({ to: '.' })
			} catch (error) {
				const isHandled = maybeHandleFormZodError(error, value, formApi)
				if (!isHandled) {
					toast.error('Failed to update application settings')
				}
			}
		},
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Application Settings</DialogTitle>
					<DialogDescription>
						Update the memory, CPU, and access settings for your application.
					</DialogDescription>
				</DialogHeader>

				<Form
					onSubmit={() => {
						void form.handleSubmit()
					}}
				>
					<div className="space-y-6">
						<FieldSet className="border p-4">
							<FieldLegend>Resource Settings</FieldLegend>
							<FieldDescription>
								Configure memory, CPU, and port allocation for your application
							</FieldDescription>

							<FieldGroup className="grid gap-6 md:grid-cols-3">
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
												{SUPPORTED_CLOUD_RUN_MEMORY_OPTIONS.map((option) => {
													return (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													)
												})}
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
												{CPU_OPTIONS.map((option) => {
													return (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													)
												})}
											</field.SelectField>
										)
									}}
								/>

								<form.AppField
									name="port"
									children={(field) => {
										return (
											<field.TextField
												labelProps={{
													children: 'Port *',
												}}
												inputProps={{
													type: 'number',
													min: 1,
													max: 65535,
													autoComplete: 'off',
													required: true,
												}}
												helperText="The port your application listens on"
											/>
										)
									}}
								/>
							</FieldGroup>
						</FieldSet>

						<FieldSet className="border p-4">
							<FieldLegend>Access Settings</FieldLegend>
							<FieldDescription>
								Configure how your application can be accessed
							</FieldDescription>

							<FieldGroup>
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
							</FieldGroup>
						</FieldSet>
					</div>

					<div className="flex gap-4 pt-6">
						<Button variant="outline" type="button">
							Cancel
						</Button>
						<form.AppForm>
							<form.SubscribeButton className="flex-1">
								Update Settings
							</form.SubscribeButton>
						</form.AppForm>
					</div>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
