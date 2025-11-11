import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
	AlertTriangle,
	ArrowDownAZ,
	ArrowUpAZ,
	Eye,
	GlobeIcon,
	SlidersHorizontal,
	Trash,
} from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { z } from 'zod/v4'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { siteInfo } from '@/config/site'
import { deleteApplicationComplete } from '@/database/applications'
import { useDebounceFn } from '@/hooks/use-debounce-fn'
import type { Application } from '@/utils/validation'
import { applicationsQueryOptions } from './app/applications/-data/query-options'

const applicationsSearchSchema = z.object({
	filter: z.string().optional().catch(''),
	sort: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute('/app/applications/')({
	validateSearch: applicationsSearchSchema,
	head: () => ({
		meta: [{ title: `Applications - ${siteInfo.title}` }],
	}),
	async loader({ context }) {
		await context.queryClient.ensureQueryData(applicationsQueryOptions())
	},
	component: RouteComponent,
})

function DeleteDialog({
	open,
	setOpen,
	application,
}: {
	open: boolean
	setOpen: (open: boolean) => void
	application: Application & { id: string }
}) {
	const deleteApplicationFn = useServerFn(deleteApplicationComplete)
	const [isDeleting, startTransition] = useTransition()
	const queryClient = Route.useRouteContext({
		select: (options) => options.queryClient,
	})

	const handleDelete = async () => {
		startTransition(async () => {
			if (!application.id) {
				toast.error('Cannot delete application: Missing application ID')
				return
			}

			try {
				await deleteApplicationFn({
					data: {
						id: application.id,
						triggerId: application.trigger_details?.id,
						region: application.region,
						triggerName: application.trigger_details?.name,
					},
				})

				setOpen(false)
				toast.success(`Application "${application.name}" deleted successfully`)
				await queryClient.invalidateQueries(applicationsQueryOptions())
			} catch (error) {
				console.error('Error deleting application:', error)
				toast.error('Failed to delete application. Please try again.')
			}
		})
	}

	return (
		<ConfirmDialog
			onOpenChange={() => {
				setOpen(false)
			}}
			open={open}
			handleConfirm={handleDelete}
			disabled={isDeleting}
			title={
				<span className="text-destructive">
					<AlertTriangle
						className="stroke-destructive me-1 inline-block"
						size={18}
					/>{' '}
					Delete Application
				</span>
			}
			desc={
				<div className="space-y-4">
					<p className="mb-2">
						Are you sure you want to delete{' '}
						<span className="font-bold">{application?.name}</span>?
						<br />
						This will permanently delete the application and its Cloud Build
						trigger. This action cannot be undone.
					</p>
				</div>
			}
			confirmText={isDeleting ? 'Deleting...' : 'Delete'}
			destructive
		/>
	)
}

function RouteComponent() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<h1 className="text-4xl font-bold">Applications</h1>
			<div className="flex justify-between gap-8 items-center flex-wrap">
				<h2 className="text-muted-foreground -mt-2 uppercase font-medium text-sm">
					List of all applications
				</h2>
				<Button asChild>
					<Link to="/app/applications/create">Create Application</Link>
				</Button>
			</div>

			<ListApplications />
		</div>
	)
}

function ListApplications() {
	const { data: applications } = useSuspenseQuery(applicationsQueryOptions())
	const navigate = Route.useNavigate()
	const { filter = '', sort: initSort = 'asc' } = Route.useSearch()

	const [sort, setSort] = useState(initSort)
	const [searchTerm, setSearchTerm] = useState(filter)

	const { run: updateSearch } = useDebounceFn(() => {
		navigate({
			search: (prev) => ({
				...prev,
				filter: searchTerm || undefined,
			}),
		})
	}, 800)

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
		updateSearch()
	}

	const handleSortChange = (sort: 'asc' | 'desc') => {
		setSort(sort)
		navigate({ search: (prev) => ({ ...prev, sort }) })
	}

	const filteredApplications = applications
		?.sort((a, b) =>
			sort === 'asc'
				? a.name.localeCompare(b.name)
				: b.name.localeCompare(a.name),
		)
		.filter((application) =>
			application.name.toLowerCase().includes(searchTerm.toLowerCase()),
		)

	return (
		<>
			<div className="my-4 flex items-end justify-between sm:my-0 sm:items-center">
				<div className="flex flex-col gap-4 sm:my-4 sm:flex-row">
					<Input
						placeholder="Filter applications..."
						className="h-9 w-40 lg:w-[250px]"
						value={searchTerm}
						onChange={handleSearch}
					/>
				</div>

				<Select value={sort} onValueChange={handleSortChange}>
					<SelectTrigger className="w-16">
						<SelectValue>
							<SlidersHorizontal size={18} />
						</SelectValue>
					</SelectTrigger>
					<SelectContent align="end">
						<SelectItem value="asc">
							<div className="flex items-center gap-4">
								<ArrowUpAZ size={16} />
								<span>Ascending</span>
							</div>
						</SelectItem>
						<SelectItem value="desc">
							<div className="flex items-center gap-4">
								<ArrowDownAZ size={16} />
								<span>Descending</span>
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<Separator className="shadow-sm" />
			<ul className="grid gap-4 overflow-auto pt-4 pb-16 md:grid-cols-2 lg:grid-cols-3">
				{!filteredApplications || filteredApplications.length === 0 ? (
					<li className="col-span-full">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<GlobeIcon />
								</EmptyMedia>
								<EmptyTitle>No Applications Found</EmptyTitle>
								<EmptyDescription>
									You haven&apos;t created any applications yet or no
									application matches your current filter.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								{(!applications || applications?.length === 0) && (
									<div className="flex gap-2">
										<Button asChild>
											<Link to="/app/applications/create">
												Create Application
											</Link>
										</Button>
									</div>
								)}
							</EmptyContent>
						</Empty>
					</li>
				) : (
					filteredApplications.map((application) => (
						<ApplicationCard key={application.id} application={application} />
					))
				)}
			</ul>
		</>
	)
}

function ApplicationCard({
	application,
}: {
	application: Application & { id: string }
}) {
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

	return (
		<li className="rounded-lg border p-4 hover:shadow-md">
			<DeleteDialog
				open={openDeleteDialog}
				setOpen={setOpenDeleteDialog}
				application={application}
			/>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link
							to="/app/applications/$applicationId"
							params={{ applicationId: application.id }}
						>
							<Eye size={14} /> View
						</Link>
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setOpenDeleteDialog(true)}
					>
						<Trash size={14} /> Delete
					</Button>
				</div>
			</div>
			<div className="space-y-2">
				<h2 className="font-semibold text-lg">{application.name}</h2>
				<div className="text-sm text-muted-foreground space-y-1">
					<p className="truncate">
						<strong>Repository:</strong> {application.repository}
					</p>
					<p>
						<strong>Branch:</strong> {application.git_branch}
					</p>
					<p>
						<strong>Region:</strong> {application.region}
					</p>
					<p>
						<strong>Port:</strong> {application.port}
					</p>
					{application.url && (
						<p className="truncate">
							<strong>URL:</strong>{' '}
							<a
								href={application.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:underline"
							>
								{application.url}
							</a>
						</p>
					)}
				</div>
				{application.tags && application.tags.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-2">
						{application.tags.slice(0, 3).map((tag) => (
							<Badge key={tag} variant="secondary" className="text-xs">
								{tag}
							</Badge>
						))}
						{application.tags.length > 3 && (
							<Badge variant="secondary" className="text-xs">
								+{application.tags.length - 3} more
							</Badge>
						)}
					</div>
				)}
			</div>
		</li>
	)
}
