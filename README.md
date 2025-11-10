# OmniDeploy Run

Deploy serverless applications to Google Cloud Run with ease. A full-stack TypeScript application built with TanStack Start, Better Auth, and Google Cloud Firestore.

## Features

- 🚀 Deploy applications to Google Cloud Run
- 🔐 Authentication with passkeys (Better Auth)
- 📊 Project and application management
- 🔗 GitHub repository integration
- 🎨 Modern UI with shadcn/ui and Tailwind CSS v4
- 📱 Responsive design with mobile support

## Tech Stack

- **Frontend**: React 19, TanStack Router, TanStack Form
- **Backend**: TanStack Start (SSR framework)
- **Database**: Google Cloud Firestore
- **Auth**: Better Auth with passkey support
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI)
- **Validation**: Zod v4
- **Tooling**: Biome (formatting + linting), Vitest

## Prerequisites

- Node.js 18+ and pnpm
- Google Cloud Platform account
- Google Cloud Project with the following APIs enabled:
  - Cloud Build API
  - Cloud Run Admin API
  - Secret Manager API
  - Cloud Firestore API
  - Artifact Registry API

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

### Forms

Forms use TanStack Form with custom composition in `src/lib/form.ts`. Always wrap forms with the `<Form>` component and use `<SubscribeButton>` for submit buttons.

### Routing

File-based routing with dots for nesting:

- `app.applications.create.tsx` → `/app/applications/create`
- Private folders start with `-` (e.g., `src/routes/-form/`)

## Development Guidelines

- Use **tabs for indentation** (Biome configured)
- Path alias: `@/*` maps to `src/*`
- Add shadcn components: `pnpx shadcn@latest add <component>`
- Server-side: Use `getFirestoreClient()` singleton
- Convert Firestore `Timestamp` to JS `Date` when returning data
- See `AGENTS.md` for detailed AI coding agent instructions

## Testing

Run tests with:

```bash
pnpm test
```

Test files are located adjacent to source files with `*.test.ts` extension.

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.
