import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import type { Row } from '@tanstack/react-table'
import {
	type ColumnDef,
	type ColumnOrderState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from '@tanstack/react-table'
import {
	AlertTriangle,
	Ellipsis,
	RefreshCwIcon,
	SearchIcon,
	Settings2,
	XIcon,
} from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardFooter,
	CardHeader,
	CardHeading,
	CardTable,
	CardToolbar,
} from '@/components/ui/card'
import { DataGrid } from '@/components/ui/data-grid'
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility'
import { DataGridPagination } from '@/components/ui/data-grid-pagination'
import { DataGridTable } from '@/components/ui/data-grid-table'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
	deleteGithubConnectionServerFn,
	syncConnectionsServerFn,
} from '@/lib/server-fns/connections'
import type { Connection } from '@/utils/validation'
import {
	connectionQueryOptions,
	getConnectionQueryKey,
} from '../-data/query-options'
import {
	BitbucketIcon as IconBrandBitbucket,
	GithubIcon as IconBrandGithub,
	GitlabIcon as IconBrandGitlab,
} from './icons'

type ConnectionData = Pick<
	Connection,
	| 'connectionId'
	| 'name'
	| 'displayName'
	| 'location'
	| 'type'
	| 'createTime'
	| 'updateTime'
	| 'reconciling'
	| 'installationState'
	| 'disabled'
	| 'username'
	| 'status'
	| 'updated_at'
	| 'created_at'
>

const getConnectionIcon = (type: 'github' | 'gitlab' | 'bitbucket') => {
	switch (type) {
		case 'github':
			return <IconBrandGithub className="size-5" />
		case 'gitlab':
			return <IconBrandGitlab className="size-5" />
		case 'bitbucket':
			return <IconBrandBitbucket className="size-5" />
		default:
			return <IconBrandGithub className="size-5" />
	}
}

const getStatusBadge = (
	status?: 'pending' | 'active' | 'error' | 'action_required',
) => {
	switch (status) {
		case 'active':
			return <Badge variant="success">Active</Badge>
		case 'pending':
			return <Badge variant="outline">Pending</Badge>
		case 'error':
			return <Badge variant="destructive">Error</Badge>
		case 'action_required':
			return <Badge variant="destructive">Action Required</Badge>
		default:
			return <Badge variant="outline">Unknown</Badge>
	}
}

const routeApi = getRouteApi('/app/connections/')

function DeleteDialog({
	open,
	setOpen,
	currentRow,
}: {
	open: boolean
	setOpen: (open: boolean) => void
	currentRow: ConnectionData
}) {
	const deleteFn = useServerFn(deleteGithubConnectionServerFn)
	const [isDeleting, startTransition] = useTransition()
	const queryClient = routeApi.useRouteContext({
		select: (options) => options.queryClient,
	})

	const handleDelete = async () => {
		startTransition(async () => {
			//
			if (currentRow.type === 'github') {
				try {
					await deleteFn({
						data: {
							connectionId: currentRow.connectionId,
							type: 'github',
						},
					})
					setOpen(false)
					toast.success('Connection deleted successfully')
					await queryClient.invalidateQueries({
						queryKey: getConnectionQueryKey(),
					})
				} catch (e) {
					console.log(e)
					toast.error('Failed to delete connection. Please try again.')
				}
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
					Delete Connection
				</span>
			}
			desc={
				<div className="space-y-4">
					<p className="mb-2">
						Are you sure you want to delete{' '}
						<span className="font-bold">{currentRow?.displayName}</span>?
						<br />
						This action will permanently remove the connection from your google
						cloud account. This cannot be undone.
					</p>
				</div>
			}
			confirmText={isDeleting ? 'Deleting...' : 'Delete'}
			destructive
		/>
	)
}

function ActionsCell({ row }: { row: Row<ConnectionData> }) {
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
	return (
		<div>
			<DeleteDialog
				open={openDeleteDialog}
				setOpen={setOpenDeleteDialog}
				currentRow={row.original}
			/>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className="size-7" size="icon" variant="ghost">
						<Ellipsis />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="bottom" align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						onClick={() => {
							setOpenDeleteDialog(true)
						}}
					>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

export default function ListConnections() {
	const queryClient = routeApi.useRouteContext({
		select: (options) => options.queryClient,
	})

	const { data, isLoading } = useSuspenseQuery(connectionQueryOptions())

	const [isPending, startTransition] = useTransition()
	const syncFn = useServerFn(syncConnectionsServerFn)

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	})
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'displayName', desc: true },
	])
	const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
	const [searchQuery, setSearchQuery] = useState('')

	const handleRefresh = () => {
		startTransition(async () => {
			try {
				// First sync connections from Google Cloud to Firestore
				await syncFn()
				// Then invalidate the query to refresh the UI
				await queryClient.invalidateQueries({
					queryKey: getConnectionQueryKey(),
				})
				toast.success('Connections synced successfully')
			} catch (error) {
				console.error('Failed to sync connections:', error)
				toast.error('Failed to sync connections. Please try again.')
			}
		})
	}

	const connections = data.connections

	const filteredData = useMemo(() => {
		return connections.filter((item) => {
			// Filter by search query (case-insensitive)
			const searchLower = searchQuery.toLowerCase()
			const matchesSearch =
				!searchQuery ||
				Object.values(item)
					.join(' ') // Combine all fields into a single string
					.toLowerCase()
					.includes(searchLower)
			return matchesSearch
		})
	}, [searchQuery, connections])

	const columns = useMemo<ColumnDef<ConnectionData>[]>(
		() => [
			{
				accessorKey: 'displayName',
				id: 'displayName',
				header: 'Connection',
				cell: ({ row }) => {
					return (
						<div className="flex items-center gap-3">
							<Avatar className="size-8">
								<AvatarFallback className="bg-muted">
									{getConnectionIcon(row.original.type)}
								</AvatarFallback>
							</Avatar>
							<div className="space-y-px">
								<div className="font-medium text-foreground">
									{row.original.displayName}
								</div>
								{row.original.username && (
									<div className="text-muted-foreground text-xs">
										@{row.original.username}
									</div>
								)}
							</div>
						</div>
					)
				},
				size: 250,
				enableSorting: true,
				enableHiding: false,
			},
			{
				accessorKey: 'type',
				header: 'Type',
				cell: (info) => (
					<span className="capitalize">{info.getValue() as string}</span>
				),
				size: 100,
			},
			{
				accessorKey: 'location',
				header: 'Location',
				cell: (info) => (
					<span className="text-xs">{info.getValue() as string}</span>
				),
				size: 150,
			},
			{
				id: 'status',
				header: 'Status',
				cell: ({ row }) => getStatusBadge(row.original.status),
				size: 120,
				enableSorting: true,
			},
			{
				accessorKey: 'createTime',
				header: 'Created',
				cell: (info) => {
					const date = info.getValue() as Date | undefined
					return date ? (
						<span className="text-xs">{date.toLocaleDateString()}</span>
					) : (
						'-'
					)
				},
				size: 120,
			},
			{
				id: 'actions',
				header: '',
				cell: ({ row }) => <ActionsCell row={row} />,
				size: 60,
				enableSorting: false,
				enableHiding: false,
				enableResizing: false,
			},
		],
		[],
	)

	const table = useReactTable({
		columns,
		data: filteredData,
		pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
		getRowId: (row: ConnectionData) => row.name || row.displayName,
		state: {
			pagination,
			sorting,
			columnOrder,
		},
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		onColumnOrderChange: setColumnOrder,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	return (
		<div>
			<DataGrid
				table={table}
				recordCount={filteredData?.length || 0}
				tableLayout={{
					cellBorder: true,
					columnsVisibility: true,
					width: 'auto',
				}}
				tableClassNames={{
					edgeCell: 'px-5',
				}}
				isLoading={isLoading}
			>
				<Card>
					<CardHeader className="py-3.5">
						<CardHeading>
							<div className="flex items-center gap-2.5">
								<InputGroup>
									<InputGroupAddon align="inline-start">
										<SearchIcon />
									</InputGroupAddon>
									<InputGroupInput
										placeholder="Search..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="w-40"
									/>
									<InputGroupAddon align="inline-end">
										{searchQuery.length > 0 && (
											<Button
												size="icon"
												variant="ghost"
												className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
												onClick={() => setSearchQuery('')}
											>
												<XIcon />
											</Button>
										)}
									</InputGroupAddon>
								</InputGroup>
							</div>
						</CardHeading>

						<CardToolbar className="max-sm:flex-wrap">
							<Button
								onClick={handleRefresh}
								disabled={isPending}
								variant="outline"
								size="sm"
							>
								<RefreshCwIcon className={isPending ? 'animate-spin' : ''} />
								Refresh
							</Button>
							<DataGridColumnVisibility
								table={table}
								trigger={
									<Button variant="outline" size="sm">
										<Settings2 />
										Columns
									</Button>
								}
							/>
						</CardToolbar>
					</CardHeader>
					<CardTable className="overflow-x-auto">
						<ScrollArea>
							<DataGridTable />
							<ScrollBar orientation="horizontal" />
							<ScrollBar orientation="vertical" />
						</ScrollArea>
					</CardTable>
					<CardFooter>
						<DataGridPagination />
					</CardFooter>
				</Card>
			</DataGrid>
		</div>
	)
}
