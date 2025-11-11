# OmniDeploy Run - AI Coding Agent Instructions

## Project Overview

Full-stack TypeScript application for deploying serverless apps to Google Cloud Run. Built with TanStack Start (React SSR framework), Better Auth, and Google Cloud Firestore with comprehensive cloud integration.

## Architecture

### Stack

- **Frontend**: React 19 + TanStack Router (file-based routing with type-safe navigation)
- **Backend**: TanStack Start (SSR framework with server functions)
- **Auth**: Better Auth with passkey support + custom Firestore adapter
- **Database**: Google Cloud Firestore (via custom adapter at `src/utils/better-auth-firestore-adapter.ts`)
- **Cloud Services**: Cloud Build, Cloud Run, Cloud Logging, Artifact Registry, Cloud IAM
- **Forms**: TanStack Form with custom hook composition pattern
- **UI**: shadcn/ui components (Radix UI + Tailwind CSS v4)
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Validation**: Zod v4
- **Tooling**: Biome (formatting + linting), Vitest
- **Real-time**: Server-Sent Events for build log streaming

### Key Patterns

#### Server Functions (`createServerFn`)

All backend operations use TanStack Start's `createServerFn` pattern in `src/database/*.ts` and `src/lib/server-fns/*.ts`:

```typescript
export const updateApplication = createServerFn({ method: "POST" })
  .inputValidator(applicationSchema.pick({ memory: true, cpu: true }))
  .handler(async ({ data }) => {
    // Update Firestore record
    await updateApplicationFn({ data: { id: data.id, ...data } });

    // Update Cloud Build trigger
    await updateCloudBuildTriggerServerFn({
      data: { triggerId: data.triggerId, ...data },
    });

    return { success: true };
  });
```

- Use on client with `useServerFn(functionName)`
- Always validate input with `.inputValidator(zodSchema)`
- Return serializable data only (Firestore Timestamps → JS Dates)
- Handle two-phase updates (Firestore + Cloud APIs) for settings changes

#### Cloud Service Integration

Cloud services are organized in `src/services/` with dedicated API clients:

- `cloud-build.ts`: Build triggers, executions, and log streaming
- `cloud-run.ts`: Service deployments and configuration management
- `cloud-logging.ts`: Log aggregation and filtering
- `artifact-registry.ts`: Container registry management
- `cloud-iam.ts`: Service account and permissions

#### Real-Time Features

**Log Streaming** uses Server-Sent Events:

```typescript
// API Route: src/routes/api/logs/$applicationId/builds/$buildId.ts
export const GET = ({ params }) => {
  const stream = new ReadableStream({
    start(controller) {
      // Stream logs from Cloud Logging
      loggingClient.tailLogEntries({
        filter: `resource.labels.service_name="${params.applicationId}"`,
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
};

// Hook: src/hooks/use-log-stream.tsx
const useLogStream = (applicationId, buildId) => {
  // EventSource with proper error handling and connection management
};
```

#### Authentication Flow

- Routes under `/app/*` require authentication via `beforeLoad: requireAuthentedUser()` (see `src/routes/app.tsx`)
- Auth middleware in `src/utils/auth.ts` uses Better Auth's session API
- Custom Firestore adapter transforms Better Auth's `id` field to/from `_id` for Firestore compatibility
- Session configured for 7-day expiry with 1-day update age

#### Forms with TanStack Form

Custom composition pattern in `src/lib/form.ts` with comprehensive validation:

```typescript
const form = useAppForm({
  defaultValues: {
    memory: application.memory,
    number_of_cpus: application.number_of_cpus,
    allow_public_access: application.allow_public_access,
    port: application.port,
  },
  validators: { onSubmit: updateApplicationSettingsSchema },
  async onSubmit({ value, formApi }) {
    try {
      // Two-phase update pattern for settings
      await updateApplicationFn({ data: { id: app.id, ...value } });

      if (application.trigger_details?.id) {
        await updateTriggerFn({
          data: {
            triggerId: application.trigger_details.id,
            location: application.region,
            ...value,
          },
        });
      }

      toast.success("Settings updated successfully");
    } catch (e) {
      maybeHandleFormZodError(e, value, formApi);
    }
  },
});
```

- Field components: `TextField`, `SelectField`, `TextAreaField`, `CheckboxField`, `SwitchField` in `src/components/form-components.tsx`
- Always use `<Form>` wrapper component (prevents default, stops propagation)
- Use `<SubscribeButton>` for submit buttons (shows loading state automatically)
- Use `maybeHandleFormZodError` utility for server validation error mapping
- Schema reuse: Pick fields from main schemas for consistency (`applicationSchema.pick({ memory: true })`)

#### Routing & Navigation

- File-based routing: `src/routes/*.tsx` → auto-generated `routeTree.gen.ts`
- Route naming: dots create nesting (`app.applications.$applicationId.builds.$buildId.logs.tsx` → `/app/applications/:id/builds/:buildId/logs`)
- Private folders: prefix with `-` (e.g., `src/routes/-form/`)
- Loader/beforeLoad for data fetching with TanStack Query integration via `setupRouterSsrQueryIntegration`

#### Component Patterns

**Settings Dialog Pattern**:

```typescript
// ApplicationSettingsDialog component in src/components/
export function ApplicationSettingsDialog({ trigger, application }) {
  const updateApplicationFn = useServerFn(updateApplication)
  const updateTriggerFn = useServerFn(updateCloudBuildTriggerServerFn)

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <Form onSubmit={() => void form.handleSubmit()}>
          <FieldSet className="border p-4">
            <FieldLegend>Resource Settings</FieldLegend>
            <FieldGroup className="grid gap-6 md:grid-cols-3">
              {/* Memory, CPU, Port fields */}
            </FieldGroup>
          </FieldSet>
          <form.AppForm>
            <form.SubscribeButton>Update Settings</form.SubscribeButton>
          </form.AppForm>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

**Real-Time Log Viewer**:

```typescript
// Fullscreen log viewer with SSE integration
function LogsViewer({ applicationId, buildId }) {
  const { logs, connectionStatus, error } = useLogStream(applicationId, buildId)
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <div className={isFullscreen ? 'fullscreen-overlay' : ''}>
      <ScrollArea className={isFullscreen ? 'h-[calc(100vh-12rem)]' : 'h-96'}>
        {logs.map(log => <LogEntry key={log.id} {...log} />)}
      </ScrollArea>
    </div>
  )
}
```

#### Error Handling

- Server functions throw JSON-stringified Zod errors: `throw Error(JSON.stringify([{ path, message }]))`
- Use `maybeHandleFormZodError()` to map server errors to form field errors
- Toast for unexpected errors via `sonner`
- EventSource error handling with proper reconnection logic
- Two-phase operation errors (Firestore + Cloud API) with rollback considerations

### File Organization

- `src/database/` - Server functions for CRUD operations (applications, projects, onboarding)
- `src/lib/server-fns/` - Specialized cloud operations (cloud-build, connections, repositories, service-accounts)
- `src/services/` - Google Cloud API clients (cloud-build, cloud-run, cloud-logging, etc.)
- `src/routes/` - File-based routing with SSR loaders
- `src/routes/api/` - API endpoints (auth, logs SSE)
- `src/components/` - Reusable UI components
  - `ui/` - shadcn components (excluded from Biome linting)
  - `layout/` - Navigation, headers, error boundaries
  - `shared/` - Logos, dialogs, reusable components
- `src/hooks/` - Custom React hooks (log streaming, form helpers, etc.)
- `src/lib/` - Core utilities (auth, forms, Firestore client)
- `src/utils/` - Helper functions (validation schemas, auth middleware)

### Recent Key Features

#### Application Settings Management

- **Component**: `src/components/application-settings-dialog.tsx`
- **Pattern**: Two-phase updates (Firestore + Cloud Build trigger)
- **Fields**: Memory, CPU, Port, Public Access
- **Integration**: Uses existing `updateApplication` + new `updateCloudBuildTriggerServerFn`

#### Real-Time Build Log Streaming

- **API Route**: `src/routes/api/logs/$applicationId/builds/$buildId.ts`
- **Hook**: `src/hooks/use-log-stream.tsx`
- **Features**: SSE with EventSource, connection status, error handling
- **UI**: Fullscreen modal with transitions, ScrollArea height management

#### Cloud Build Trigger Management

- **Server Function**: `src/lib/server-fns/cloud-build.ts#updateCloudBuildTriggerServerFn`
- **Purpose**: Update deployment configuration (memory, CPU, ingress)
- **Integration**: Called from settings dialog for immediate effect

## Commands

```bash
pnpm dev          # Dev server on port 3003
pnpm build        # Production build
pnpm test         # Run Vitest tests
pnpm check        # Biome format + lint check
pnpm format       # Format with Biome
```

## Environment

Required env vars in `.env` (see `src/env.ts`):

- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` - Auth config
- `FIRESTORE_DATABASE_ID` - Firestore database name
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to GCP service account key file (dev only)

## Conventions

- Path alias: `@/*` → `src/*` (configured in `tsconfig.json` + Vite)
- Import shadcn components: `pnpx shadcn@latest add <component>`
- Biome config excludes `src/components/ui/**` and `routeTree.gen.ts`
- Use tab indentation (Biome configured)
- Server-side: Use `getFirestoreClient()` singleton for Firestore access
- Always convert Firestore `Timestamp` to JS `Date` when returning data from server functions

## Critical Development Patterns

### Two-Phase Update Pattern

For settings that affect both database and cloud infrastructure:

```typescript
// 1. Update Firestore record
await updateApplicationFn({ data: { id, ...newSettings } });

// 2. Update cloud infrastructure
if (application.trigger_details?.id) {
  await updateCloudBuildTriggerServerFn({
    data: { triggerId: application.trigger_details.id, ...newSettings },
  });
}
```

### Schema Consistency Pattern

Reuse application schema for form validation:

```typescript
const updateApplicationSettingsSchema = applicationSchema.pick({
  memory: true,
  number_of_cpus: true,
  allow_public_access: true,
  port: true,
});
```

### Server-Sent Events Pattern

For real-time data streaming:

```typescript
// Server: Return ReadableStream with proper headers
export const GET = ({ params }) => {
  const stream = new ReadableStream({
    start(controller) {
      /* stream logic */
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
};

// Client: EventSource with error handling
const eventSource = new EventSource(url);
eventSource.onmessage = (event) => {
  /* handle data */
};
eventSource.onerror = () => {
  /* handle errors */
};
```

### Dialog Integration Pattern

Settings dialogs trigger from existing buttons:

```typescript
<ApplicationSettingsDialog
  trigger={
    <Button variant="outline">
      <SettingsIcon size={16} />
      Settings
    </Button>
  }
  application={application}
/>
```

## Testing

- Test files: `*.test.ts` adjacent to source
- Firestore adapter has comprehensive tests in `src/utils/better-auth-firestore-adapter.test.ts`
- Run with `pnpm test`
- Focus on server function validation, form submission flows, and cloud service integrations

## Common Implementation Tasks

### Adding New Settings Fields

1. Add field to `applicationSchema` in `src/utils/validation.ts`
2. Update `updateApplication` handler in `src/database/applications.ts`
3. Update `updateCloudBuildTriggerServerFn` substitutions in `src/lib/server-fns/cloud-build.ts`
4. Add form field to `ApplicationSettingsDialog` component
5. Test two-phase update (Firestore + Cloud Build trigger)

### Adding New Cloud Service Integration

1. Create service client in `src/services/[service-name].ts`
2. Add server functions in `src/lib/server-fns/[service-name].ts`
3. Import and use in components/pages with `useServerFn()`
4. Add proper error handling and validation
5. Test with appropriate Google Cloud permissions

### Adding Real-Time Features

1. Create SSE endpoint in `src/routes/api/[feature]/[params].ts`
2. Implement custom hook in `src/hooks/use-[feature]-stream.tsx`
3. Add EventSource with proper connection management
4. Handle loading states and errors in UI components
5. Consider cleanup and memory management for long-running streams
