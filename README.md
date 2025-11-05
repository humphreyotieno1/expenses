# Personal Expense Tracker

A full-stack expense tracking app built with Next.js 15 (App Router) and Bun. It features secure authentication, a PostgreSQL data layer managed via Prisma, API route handlers for expense CRUD operations, and a responsive dashboard powered by Zustand state with interactive visualizations (Recharts + shadcn/ui).

## Features

- **Authentication**: NextAuth credentials provider with Prisma adapter, reusable `authOptions`, and protected routes. Toast-driven feedback, password reveal toggles, and post-signup redirects included out of the box.
- **Data Layer**: Prisma models for users and expenses deployed to Neon PostgreSQL; the generated client lives in `node_modules/@prisma/client` and is shared across API handlers and client utilities.
- **RESTful API**: `/api/expenses` (GET/POST/PUT/DELETE) provides paginated results, summary metrics, trend data, and category breakdowns; `/api/users/me` lets users finish onboarding or update their default currency via PATCH.
- **State & Persistence**: Zustand store with pagination-aware fetching, actionable summaries, trend/category aggregations, and local filter persistence for snappy UX.
- **Dashboard UI**: Transaction table with modals for add/edit/delete, CSV export, rich filtering (type, category, date range, search), currency selector, and Recharts-powered trend & category charts.
- **Tooling**: Bun for package management & scripts, Tailwind v4, TypeScript strict mode, ESLint config from Next.js, Sonner for toast notifications, and shadcn/ui components.

## Prerequisites

- [Bun](https://bun.sh/) ≥ 1.3.1 (for dependency management & scripts)
- Node.js ≥ 18 (required by Next.js 15)
- PostgreSQL connection (Neon connection string provided during setup)

## Getting Started

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Environment variables**
   - Copy `.env` (already contains the Neon connection string provided) or create a fresh `.env` from the template:
     ```bash
     cp .env.example .env
     ```
   - Required values:
     ```bash
     DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
     NEXTAUTH_SECRET="<generate-a-strong-random-string>"
     NEXTAUTH_URL="http://localhost:3000"   # update to production origin when deployed
     ```
   - Optional: add OAuth provider credentials if you extend NextAuth beyond credentials login.

3. **Prisma migrations & client**
   ```bash
   bunx prisma migrate dev
   ```
   This applies the schema to your configured database and regenerates the Prisma client into `node_modules/@prisma/client`.

4. **Run the development server**
   ```bash
   bun run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to use the app.

5. **Linting**
   ```bash
   bun run lint
   ```

## Project Structure

```
app/
  api/expenses/        # Route handlers for expense CRUD (GET, POST, PUT, DELETE)
  api/users/me/        # PATCH handler for onboarding + currency updates
  dashboard/           # Protected dashboard page (server component)
  login/, register/, onboarding/   # Auth & onboarding entry points
components/
  auth/                # Sign-in/out/onboarding client components
  dashboard/           # Dashboard charts, dialogs, tables
  ui/                  # shadcn/ui building blocks + toaster
lib/
  auth.ts              # NextAuth options
  currency.ts          # Supported currency helpers
  prisma.ts            # Prisma client singleton
  validators/          # Zod schemas shared by API + client
store/
  expense-store.ts     # Zustand store with pagination + analytics
prisma/
  schema.prisma        # Prisma models (User, Expense, Auth tables)
  migrations/          # Generated SQL migrations
```

## Authentication Setup

- The credentials provider expects users to have `email` + `passwordHash` (bcrypt) stored in the `User` table.
- Seed users manually (e.g., via script or `prisma studio`) using `bcryptjs` to hash passwords.
- Protect additional routes by updating `proxy.ts` matchers.

## Dashboard Highlights

- **Transaction CRUD**: Add or edit via the transaction dialog, delete with confirmation, and see immediate updates thanks to the Zustand store.
- **Filters & Pagination**: Filter by type, category, search term, and date range. Navigate pages and adjust page size without losing state.
- **Analytics**: Overview cards show totals and net balance, while charts summarize the last six months and category shares.
- **Currency Preference**: Users pick a default currency (USD, KES, EUR, ZAR, JPY) during onboarding or later from the dashboard; values reformat automatically.
- **Export**: Download filtered transactions as CSV with a single click.

## Deployment Notes

- Set `NEXTAUTH_URL` to the production origin (e.g., Vercel URL) and ensure `NEXTAUTH_SECRET` is configured in the hosting environment.
- Run `bunx prisma migrate deploy` on production to apply migrations.
- Keep Prisma client binaries up to date: after changing the schema locally run `bunx prisma generate` so both the native (dev) and `rhel-openssl-3.0.x` (Linux deploy) engines are emitted in `node_modules/@prisma/client`.
- Configure Neon (or chosen Postgres provider) networking/connection pooling as needed.

## Troubleshooting

- **Auth errors**: Confirm `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and database credentials are present in the runtime environment.
- **Database connectivity**: Verify SSL parameters in `DATABASE_URL` (Neon requires `sslmode=require`).
- **Charts showing no data**: Seed or add transactions via the API/UI; charts only render once relevant data exists.
- **Missing Prisma engine on deploy**: Ensure `bun run build` (and `postinstall`) execute `prisma generate` so the Linux query engine ships with your deployment.

## Scripts

- `bun run dev` – Start Next.js dev server with hot reload.
- `bun run build` – Production build (regenerates Prisma client + Next.js build output).
- `bun run start` – Runs the production server (`next start`).
- `bun run lint` – Runs ESLint against the project.
- `bunx prisma migrate dev` – Apply & generate new migrations locally.

Happy hacking! Let me know if you need help extending the app (budgets, CSV export, OAuth providers, etc.).
