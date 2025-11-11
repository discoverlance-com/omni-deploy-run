# OmniDeploy Run

Deploy serverless applications to Google Cloud Run with ease. A full-stack TypeScript application built with TanStack Start, Better Auth, and Google Cloud Firestore.

## Features

- 🚀 **Deploy applications to Google Cloud Run** with automated CI/CD via Cloud Build
- 🔐 **Authentication with passkeys** (Better Auth + custom Firestore adapter)
- 📊 **Project and application management** with real-time build logs
- 🔗 **GitHub repository integration** with automated build triggers
- ⚙️ **Application settings management** (memory, CPU, port, public access)
- 📋 **Real-time build log streaming** with fullscreen viewing
- 🎨 **Modern UI** with shadcn/ui and Tailwind CSS v4
- 📱 **Responsive design** with mobile support and dark mode
- 🔧 **Comprehensive onboarding** for Google Cloud setup

## Tech Stack

- **Frontend**: React 19, TanStack Router (file-based routing), TanStack Form
- **Backend**: TanStack Start (SSR framework with server functions)
- **Database**: Google Cloud Firestore with custom Better Auth adapter
- **Auth**: Better Auth with passkey support and 7-day sessions
- **Cloud Services**: Cloud Build, Cloud Run, Cloud Logging, Artifact Registry
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI components)
- **Validation**: Zod v4 with comprehensive schema validation
- **Tooling**: Biome (formatting + linting), Vitest testing

## Architecture Overview

### Core Services (`src/services/`)

- **Cloud Build**: Manages build triggers and executions
- **Cloud Run**: Handles service deployments and configurations
- **Cloud Logging**: Streams build and application logs
- **Artifact Registry**: Container image storage
- **Cloud IAM**: Service account and permissions management

### Server Functions (`src/lib/server-fns/`)

- **Cloud Build**: Create/update build triggers, run builds, get build info
- **Connections**: GitHub repository connection management
- **Repositories**: Repository setup and configuration
- **Service Accounts**: Google Cloud service account management
- **Onboarding**: Guided setup for new projects

### Key Features

#### Real-Time Build Logs

- Server-Sent Events (SSE) for live log streaming
- Fullscreen log viewer with smooth transitions
- Connection status indicators and error handling
- Build timestamp integration from Firestore

#### Application Settings Management

- Update memory, CPU, port, and public access settings
- Two-phase updates: Firestore + Cloud Build trigger
- Form validation with TanStack Form and Zod schemas
- Real-time UI updates after successful changes

#### Authentication & Security

- Passkey-based authentication via Better Auth
- Custom Firestore adapter with `_id` field mapping
- Protected routes with `requireAuthentedUser()` middleware
- Session management with 7-day expiry and 1-day refresh

## Prerequisites

- Node.js 18+ and pnpm
- Google Cloud Platform account with billing enabled
- Google Cloud Project with the following APIs enabled:
  - Cloud Build API
  - Cloud Run Admin API
  - Cloud Resource Manager API
  - Cloud Logging API
  - Secret Manager API
  - Cloud Firestore API
  - Artifact Registry API
  - IAM Service Account Credentials API

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/discoverlance-com/omni-deploy-run.git
cd omni-deploy-run
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up Google Cloud Project

Create a service account with the following roles:

- **Artifact Registry Administrator** - Manage container images and repositories
- **Cloud Build Connection Admin** - Manage GitHub repository connections
- **Cloud Build Editor** - Create and manage build triggers and configurations
- **Cloud Datastore User** - Access to Firestore database operations
- **Cloud Run Admin** - Deploy and manage Cloud Run services
- **Logs Viewer** - Read application and build logs
- **Logs Writer** - Write logs from builds and applications
- **Pub/Sub Admin** - Manage pub/sub topics and subscriptions (for build notifications)
- **Secret Manager Admin** - Manage secrets for environment variables
- **Service Account User** - Use service accounts for builds and deployments
- **View Service Accounts** - Basic read access to project service accounts

Download the service account key and set the path in your environment:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

### 4. Configure Environment Variables

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Required environment variables:

```bash
BETTER_AUTH_URL=http://localhost:3003
BETTER_AUTH_SECRET=your-secret-key-here
FIRESTORE_DATABASE_ID=your-firestore-database-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 5. Initialize Firestore

Create a Firestore database in your Google Cloud project and ensure the service account has access.

### 6. Start the development server

```bash
pnpm dev
```

The application will be available at `http://localhost:3003`.

### 7. Complete Onboarding

Navigate to the application and complete the guided onboarding process to:

- Connect your GitHub account
- Set up Artifact Registry
- Configure your first repository
- Deploy your first application

## Application Structure

### Frontend Pages (`src/routes/`)

- **Landing**: `/` - Public landing page
- **Onboarding**: `/onboarding` - Guided setup process
- **Dashboard**: `/app` - Main application dashboard
- **Applications**: `/app/applications` - Application management
  - **Create**: `/app/applications/create` - Deploy new application
  - **Details**: `/app/applications/:id` - Application overview with settings
  - **Build Logs**: `/app/applications/:id/builds/:buildId/logs` - Real-time log viewer
- **Connections**: `/app/connections` - GitHub repository connections
- **Settings**: `/app/settings` - User preferences
- **Profile**: `/app/profile` - User profile management

### API Routes (`src/routes/api/`)

- **Auth**: `/api/auth/*` - Better Auth endpoints
- **Logs**: `/api/logs/:appId/builds/:buildId` - Server-Sent Events for build logs

### Components (`src/components/`)

- **UI Components**: `ui/` - shadcn/ui component library
- **Form Components**: `form-components.tsx` - TanStack Form field components
- **Layout**: `layout/` - Navigation, headers, error boundaries
- **Shared**: `shared/` - Reusable components like logos, dialogs
- **Application Settings**: `application-settings-dialog.tsx` - Settings management modal

### Database Operations (`src/database/`)

- **Applications**: CRUD operations for applications and builds
- **Projects**: Project management and configuration
- **Onboarding**: Setup and initialization workflows

## Key Development Patterns

### Server Functions

All backend operations use TanStack Start's `createServerFn` pattern:

```typescript
export const updateApplication = createServerFn({ method: "POST" })
  .inputValidator(applicationSchema.pick({ memory: true, cpu: true }))
  .handler(async ({ data }) => {
    // Update Firestore
    await firestore.collection("applications").doc(data.id).update(data);

    // Update Cloud Build trigger
    await updateCloudBuildTrigger({
      triggerId: data.triggerId,
      ...data,
    });

    return { success: true };
  });
```

### Form Management

Forms use TanStack Form with custom composition:

```typescript
const form = useAppForm({
  defaultValues: { memory: "512Mi", cpu: "1" },
  validators: { onSubmit: zodSchema },
  async onSubmit({ value, formApi }) {
    try {
      await serverFn({ data: value });
    } catch (e) {
      maybeHandleFormZodError(e, value, formApi);
    }
  },
});
```

### Real-Time Features

Log streaming uses Server-Sent Events:

```typescript
// Server: src/routes/api/logs/$applicationId/builds/$buildId.ts
export const GET = (request: Request) => {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};

// Client: src/hooks/use-log-stream.tsx
const useLogStream = (applicationId, buildId) => {
  // EventSource implementation with error handling
};
```

### Authentication Flow

1. Create a new Google Cloud Project or use an existing one
2. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```
3. Create a Firestore database in your project (Native mode)
4. Create a service account for local development:
   ```bash
   gcloud iam service-accounts create omni-deploy-dev \
     --display-name="OmniDeploy Development"
   ```
5. Grant necessary permissions:

   ```bash
   # Grant Firestore access
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:omni-deploy-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/datastore.user"

   # Grant Cloud Build permissions
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:omni-deploy-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/cloudbuild.builds.editor"
   ```

6. Grant Service Account User role (required for GitHub connections):

   ```bash
   # Get your project number
   PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

   # Grant the service account permission to act as Cloud Build Service Agent
   gcloud iam service-accounts add-iam-policy-binding \
     "service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com" \
     --member="serviceAccount:omni-deploy-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

7. Download service account key:
   ```bash
   gcloud iam service-accounts keys create ./gcp-key.json \
     --iam-account=omni-deploy-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:3003
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long

# Google Cloud Configuration (Development only)
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json

# Firestore Configuration
FIRESTORE_DATABASE_ID=(default)

# Optional: Custom App Title
VITE_APP_TITLE=OmniDeploy Run
```

**Notes:**

- For `BETTER_AUTH_SECRET`, generate a secure 32+ character string
- `GOOGLE_APPLICATION_CREDENTIALS` should point to the path of your service account key file (e.g., `./gcp-key.json`)
- In production, use Google Cloud's default credentials or workload identity instead of a service account key file

### 5. Run the development server

```bash
pnpm dev
```

The application will be available at `http://localhost:3003`

## Available Scripts

```bash
pnpm dev          # Start development server on port 3003
pnpm build        # Build for production
pnpm start        # Start production server
pnpm serve        # Preview production build locally
pnpm test         # Run tests with Vitest
pnpm check        # Check formatting and linting
pnpm format       # Format code with Biome
pnpm lint         # Lint code with Biome
```

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # shadcn/ui components (auto-generated)
│   ├── layout/      # Layout components
│   └── form-components.tsx
├── database/        # Server functions for CRUD operations
├── routes/          # File-based routing (TanStack Router)
├── lib/             # Core utilities (auth, forms, Firestore)
├── utils/           # Helper functions and validation schemas
├── hooks/           # Custom React hooks
├── config/          # Configuration files
└── env.ts           # Environment variable validation
```

## Key Concepts

### Server Functions

All backend operations use TanStack Start's `createServerFn`:

```typescript
export const getApplications = createServerFn({ method: "GET" }).handler(
  async () => {
    /* ... */
  }
);
```

Use on the client with `useServerFn(functionName)`.

### Authentication

Protected routes under `/app/*` require authentication. The authentication check is done in `beforeLoad` using `requireAuthentedUser()` from `src/utils/auth.ts`.

## Commands

```bash
pnpm dev          # Development server (http://localhost:3003)
pnpm build        # Production build
pnpm test         # Run Vitest tests
pnpm check        # Biome format + lint check
pnpm format       # Format with Biome
pnpm preview      # Preview production build
```

## Development Guidelines

### Code Style

- **Indentation**: Use tabs (Biome configured)
- **Path alias**: `@/*` maps to `src/*` (configured in `tsconfig.json` + Vite)
- **Components**: Add shadcn components with `pnpx shadcn@latest add <component>`
- **Linting**: Biome excludes `src/components/ui/**` and `routeTree.gen.ts`

### Server-Side Development

- Use `getFirestoreClient()` singleton for Firestore access
- Always convert Firestore `Timestamp` to JS `Date` when returning data
- Validate inputs with `.inputValidator(zodSchema)` on server functions
- Handle errors with JSON-stringified Zod errors for form mapping

### Client-Side Development

- Use `useServerFn(functionName)` to call server functions
- Wrap forms with `<Form>` component and use `<SubscribeButton>` for submits
- Use `maybeHandleFormZodError()` for server validation error mapping
- Toast for user feedback via `sonner`

### File Organization

- **Database operations**: `src/database/` - CRUD operations with createServerFn
- **Cloud services**: `src/services/` - Google Cloud API clients
- **Server functions**: `src/lib/server-fns/` - Specialized cloud operations
- **Components**: `src/components/` - Reusable UI components
- **Routes**: `src/routes/` - File-based routing with SSR loaders
- **Utils**: `src/utils/` - Validation schemas, auth middleware
- **Hooks**: `src/hooks/` - Custom React hooks

### Routing Conventions

- File-based routing with dots for nesting: `app.applications.create.tsx` → `/app/applications/create`
- Private folders start with `-` (e.g., `src/routes/-form/`)
- Use `beforeLoad` for data fetching with TanStack Query integration

## Environment Variables

Required in `.env` (see `src/env.ts` for validation):

```bash
# Authentication
BETTER_AUTH_URL=http://localhost:3003
BETTER_AUTH_SECRET=your-secret-key-here

# Google Cloud
FIRESTORE_DATABASE_ID=your-firestore-database-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Testing

```bash
pnpm test
```

- Test files: `*.test.ts` adjacent to source files
- Comprehensive Firestore adapter tests in `src/utils/better-auth-firestore-adapter.test.ts`
- Integration tests for server functions and components

## Deployment

### Production Build

```bash
pnpm build
pnpm preview
```

### Google Cloud Deployment

The application can be deployed to Google Cloud Run. Ensure your production environment has:

1. **Firestore database** configured
2. **Service account** with appropriate permissions
3. **Environment variables** set in Cloud Run service
4. **APIs enabled** as listed in prerequisites

## Troubleshooting

### Common Issues

1. **Authentication errors**: Verify `BETTER_AUTH_SECRET` is set and Firestore adapter is configured
2. **Cloud API errors**: Check service account permissions and API enablement
3. **Build failures**: Verify GitHub connections and repository access
4. **Log streaming issues**: Check Cloud Logging API and build trigger configuration

### Debug Mode

Set environment to development for additional logging:

```bash
NODE_ENV=development pnpm dev
```

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.
