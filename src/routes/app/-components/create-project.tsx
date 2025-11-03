'use client'

import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'

import { Form } from '@/components/form-components'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { createProject } from '@/database/projects'
import { useAppForm } from '@/lib/form'
import {
	maybeHandleFormZodError,
	type Project,
	projectSchema,
} from '@/utils/validation'

const createProjectSchema = projectSchema.pick({
	name: true,
	description: true,
})

export function CreateProjectForm() {
	const addProject = useServerFn(createProject)
	const [open, setOpen] = useState(false)
	const router = useRouter()

	const form = useAppForm({
		defaultValues: {
			name: '',
			description: undefined,
		} as Pick<Project, 'name' | 'description'>,
		validators: {
			onSubmit: createProjectSchema,
		},
		async onSubmit({ value, formApi }) {
			try {
				await addProject({ data: { ...value } })

				router.invalidate()
				setOpen(false)
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

	const handleOpenChange = (o: boolean) => {
		if (!o) {
			form.reset()
		}
		setOpen(o)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button type="button">Create Project</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<Form
					onSubmit={() => {
						void form.handleSubmit()
					}}
				>
					<DialogHeader>
						<DialogTitle>Create a new project</DialogTitle>
						<DialogDescription>
							Fill in the form below to create a project
						</DialogDescription>
					</DialogHeader>
					<FieldGroup className="gap-4">
						<form.AppField
							name="name"
							children={(field) => {
								return (
									<field.TextField
										labelProps={{ children: 'Name of project *' }}
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
											children: 'Optional (description for project)',
										}}
										inputProps={{
											autoComplete: 'off',
										}}
									/>
								)
							}}
						/>
					</FieldGroup>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline" type="button">
								Cancel
							</Button>
						</DialogClose>
						<form.AppForm>
							<form.SubscribeButton>Save</form.SubscribeButton>
						</form.AppForm>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
