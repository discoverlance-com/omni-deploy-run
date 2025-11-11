import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
	ArrowDownAZ,
	ArrowUpAZ,
	Eye,
	GlobeIcon,
	SlidersHorizontal,
	Trash,
} from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod/v4'

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
import { useDebounceFn } from '@/hooks/use-debounce-fn'
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
						<li
							key={application.id}
							className="rounded-lg border p-4 hover:shadow-md"
						>
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
									<Button variant="destructive" size="sm">
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
					))
				)}
			</ul>
		</>
	)
}
