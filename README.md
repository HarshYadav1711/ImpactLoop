# ImpactLoop Foundation

Production-grade app foundation for a subscription-based golf platform.

## What is included

- Next.js App Router + TypeScript
- Tailwind CSS with base design tokens
- Mobile-first route groups and layouts:
  - Public: `(marketing)` -> `/`, `/pricing`
  - Auth: `(auth)` -> `/login`, `/signup`, `/forgot-password`
  - User: `(dashboard)` -> `/dashboard`, `/settings`
  - Admin: `(admin)` -> `/admin`, `/admin/users`
- Reusable UI primitives:
  - `Button`, `Card`, `Badge`, `Input`, `DataTable/Table`, `Dialog`, `EmptyState`
- Reusable state components:
  - `LoadingState`, `ErrorState`
- Shell layouts:
  - `MarketingShell`, `DashboardShell`, `AdminShell`
- Supabase-ready setup:
  - env template
  - SSR/browser clients
  - middleware entry point

## What is intentionally NOT included yet

- Business feature flows (subscription logic, draw logic, score rules)
- Database actions and server workflows
- Admin operations implementation

This keeps scope to foundation-only architecture.

## Environment setup

1. Copy `.env.example` to `.env.local`
2. Fill values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (reserved for future secure server-side tasks)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure (high level)

- `src/app` route groups and pages
- `src/components/ui` design system primitives
- `src/components/layout` route shell components
- `src/components/state` loading/error components
- `src/lib/supabase` Supabase client setup
- `src/lib/utils` shared utilities

## Validation

```bash
npm run lint
npm run build
```
