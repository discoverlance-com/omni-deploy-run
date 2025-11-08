# OmniDeploy Run - AI Coding Agent Instructions

## Project Overview

Full-stack TypeScript application for deploying serverless apps to Google Cloud Run. Built with TanStack Start (React SSR framework), Better Auth, and Google Cloud Firestore.

## Architecture

### Stack

- **Frontend**: React 19 + TanStack Router (file-based routing with type-safe navigation)
- **Backend**: TanStack Start (SSR framework with server functions)
- **Auth**: Better Auth with passkey support + custom Firestore adapter
- **Database**: Google Cloud Firestore (via custom adapter at `src/utils/better-auth-firestore-adapter.ts`)
- **Forms**: TanStack Form with custom hook composition pattern
- **UI**: shadcn/ui components (Radix UI + Tailwind CSS v4)
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Validation**: Zod v4
- **Tooling**: Biome (formatting + linting), Vitest

### Key Patterns

#### Server Functions (`createServerFn`)

All backend operations use TanStack Start's `createServerFn` pattern in `src/database/*.ts`:

```typescript
export const getApplications = createServerFn({ method: "GET" }).handler(
  async () => {
    /* ... */
  }
);

export const createApplication = createServerFn({ method: "POST" })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    /* ... */
  });
```

- Use on client with `useServerFn(functionName)`
- Always validate input with `.inputValidator(zodSchema)`
- Return serializable data only (Firestore Timestamps → JS Dates)

#### Authentication Flow

- Routes under `/app/*` require authentication via `beforeLoad: requireAuthentedUser()` (see `src/routes/app.tsx`)
- Auth middleware in `src/utils/auth.ts` uses Better Auth's session API
- Custom Firestore adapter transforms Better Auth's `id` field to/from `_id` for Firestore compatibility
- Session configured for 7-day expiry with 1-day update age

#### Forms with TanStack Form

Custom composition pattern in `src/lib/form.ts`:

```typescript
const form = useAppForm({
  defaultValues: {
    /* ... */
  },
  validators: { onSubmit: zodSchema },
  async onSubmit({ value, formApi }) {
    try {
      await serverFn({ data: value });
    } catch (e) {
      maybeHandleFormZodError(e, value, formApi); // handles server-side validation errors
    }
  },
});
```

- Field components: `TextField`, `SelectField`, `TextAreaField`, `CheckboxField`, `SwitchField` in `src/components/form-components.tsx`
- Always use `<Form>` wrapper component (prevents default, stops propagation)
- Use `<SubscribeButton>` for submit buttons (shows loading state automatically)
- Use `maybeHandleFormZodError` utility for server validation error mapping

#### Routing

- File-based routing: `src/routes/*.tsx` → auto-generated `routeTree.gen.ts`
- Route naming: dots create nesting (`app.applications.create.tsx` → `/app/applications/create`)
- Private folders: prefix with `-` (e.g., `src/routes/-form/`)
- Loader/beforeLoad for data fetching with TanStack Query integration via `setupRouterSsrQueryIntegration`

#### Error Handling

- Server functions throw JSON-stringified Zod errors: `throw Error(JSON.stringify([{ path, message }]))`
- Use `maybeHandleFormZodError()` to map server errors to form field errors
- Toast for unexpected errors via `sonner`

### File Organization

- `src/database/` - Server functions for CRUD operations
- `src/routes/` - File-based routing with SSR loaders
- `src/components/ui/` - shadcn components (excluded from Biome linting)
- `src/lib/` - Core utilities (auth, forms, Firestore client)
- `src/utils/` - Helper functions (validation schemas, auth middleware)

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

## Testing

- Test files: `*.test.ts` adjacent to source
- Firestore adapter has comprehensive tests in `src/utils/better-auth-firestore-adapter.test.ts`
- Run with `pnpm test`
