import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
//@ts-expect-error
import '@fontsource-variable/roboto-mono'
//@ts-expect-error
import '@fontsource-variable/roboto'

import { DefaultErrorBoundary } from '@/components/layout/error-boundary'
import { DefaultNotFound } from '@/components/layout/not-found'
import { Toaster } from '@/components/ui/sonner'
import { siteInfo } from '@/config/site'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import StoreDevtools from '../lib/demo-store-devtools'
import appCss from '../styles.css?url'

interface MyRouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				name: 'theme-color',
				content: '#f54a00',
			},
			{
				name: 'mobile-web-app-capable',
				content: 'yes',
			},
			{
				name: 'apple-mobile-web-app-title',
				content: siteInfo.title,
			},
			{
				name: 'apple-mobile-web-app-status-bar-style',
				content: 'default',
			},
			{
				name: 'application-name',
				content: siteInfo.title,
			},
			{
				title: siteInfo.title,
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
			{
				rel: 'manifest',
				href: '/manifest.json',
			},
			{
				rel: 'icon',
				href: '/favicons/favicon-16x16.png',
			},
			{
				rel: 'icon',
				href: '/favicons/apple-icon.png',
			},
		],
	}),

	shellComponent: RootDocument,
	notFoundComponent: () => {
		return <DefaultNotFound />
	},
	errorComponent: (props) => {
		return <DefaultErrorBoundary {...props} />
	},
})

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				{import.meta.env.DEV && (
					<TanStackDevtools
						config={{
							position: 'bottom-right',
						}}
						plugins={[
							{
								name: 'Tanstack Router',
								render: <TanStackRouterDevtoolsPanel />,
							},
							StoreDevtools,
							TanStackQueryDevtools,
						]}
					/>
				)}
				<Toaster position="top-right" duration={4000} closeButton />
				<Scripts />
			</body>
		</html>
	)
}
