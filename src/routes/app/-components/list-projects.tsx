'use client'

import { useLiveQuery } from '@tanstack/react-db'
import { getRouteApi, Link } from '@tanstack/react-router'
import {
	ArrowDownAZ,
	ArrowUpAZ,
	Eye,
	FolderIcon,
	SlidersHorizontal,
	Trash,
} from 'lucide-react'
import { useState } from 'react'

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
import { useDebounceFn } from '@/hooks/use-debounce-fn'
import { CreateProjectForm } from './create-project'

const routeApi = getRouteApi('/app/projects/')

export function ListProjects() {
	const data = routeApi.useLoaderData()
	const navigate = routeApi.useNavigate()
	const { filter = '', sort: initSort = 'asc' } = routeApi.useSearch()

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

	const filteredProjects = data.projects
		?.sort((a, b) =>
			sort === 'asc'
				? a.name.localeCompare(b.name)
				: b.name.localeCompare(a.name),
		)
		.filter((project) =>
			project.name.toLowerCase().includes(searchTerm.toLowerCase()),
		)

	return (
		<>
			<div className="my-4 flex items-end justify-between sm:my-0 sm:items-center">
				<div className="flex flex-col gap-4 sm:my-4 sm:flex-row">
					<Input
						placeholder="Filter projects..."
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
				{!filteredProjects || filteredProjects.length === 0 ? (
					<li className="col-span-full">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<FolderIcon />
								</EmptyMedia>
								<EmptyTitle>No Projects Found</EmptyTitle>
								<EmptyDescription>
									You haven&apos;t created any projects yet or no project
									matches your current filter.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								{(!data.projects || data.projects?.length === 0) && (
									<div className="flex gap-2">
										<CreateProjectForm />
									</div>
								)}
							</EmptyContent>
						</Empty>
					</li>
				) : (
					filteredProjects.map((project) => (
						<li
							key={project.id}
							className="rounded-lg border p-4 hover:shadow-md"
						>
							<div className="mb-8 flex items-center justify-between">
								<Button variant="outline" size="sm" asChild>
									<Link
										to="/app/projects/$projectId"
										params={{ projectId: project.id }}
									>
										<Eye /> View Project
									</Link>
								</Button>
								<Button variant="destructive" size="sm">
									<Trash /> Delete
								</Button>
							</div>{' '}
							<div>
								<h2 className="mb-1 font-semibold">{project.name}</h2>
								<p className="line-clamp-2 text-gray-500">
									{project.description}
								</p>
							</div>
						</li>
					))
				)}
			</ul>
		</>
	)
}
