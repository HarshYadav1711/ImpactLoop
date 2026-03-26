# ImpactLoop Foundation + Auth Core

This repository now includes the production-grade foundation plus authentication, authorization, and required core schema.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth (email/password)
- Supabase Postgres with RLS
- Zod validation in server actions

## Implemented auth and access control

- Email/password sign-up and sign-in using Supabase Auth
- Session cookies via Supabase SSR middleware
- Role-based access with `profiles.role` (`user`, `admin`)
- Route protection:
  - `/dashboard`, `/settings` require authentication
  - `/admin`, `/admin/users` require admin role
- Logout action included in dashboard/admin shells
- Redirect behavior:
  - unauthenticated protected access -> `/login`
  - non-admin access to `/admin*` -> `/dashboard`

## Core database schema (`supabase/schema.sql`)

Required tables implemented:

- `profiles`
- `subscriptions`
- `scores`
- `charities`
- `user_charities`
- `draws`
- `draw_entries`
- `draw_results`
- `winner_verifications`
- `payouts`

Supporting pieces:

- `handle_new_user` trigger to auto-create `profiles` records from `auth.users`
- `is_admin(uuid)` helper for policies
- update timestamp triggers for mutable tables
- RLS enabled on all core tables
- policies scoped so users can only see their own data while admin has elevated operations

## Relationship summary

- `profiles.id` -> `auth.users.id` (1:1)
- `subscriptions.user_id` -> `profiles.id` (1:1)
- `scores.user_id` -> `profiles.id` (many:1)
- `user_charities.user_id` -> `profiles.id` (1:1)
- `user_charities.charity_id` -> `charities.id` (many:1)
- `draw_entries.draw_id` -> `draws.id` (many:1)
- `draw_entries.user_id` -> `profiles.id` (many:1)
- `draw_entries.source_score_id` -> `scores.id` (optional)
- `draw_results.draw_id` -> `draws.id` (many:1)
- `draw_results.winner_entry_id` -> `draw_entries.id` (optional)
- `draw_results.winner_user_id` -> `profiles.id` (optional)
- `winner_verifications.draw_result_id` -> `draw_results.id` (1:1)
- `payouts.draw_result_id` -> `draw_results.id` (1:1)

## Seed data (`supabase/seed.sql`)

Includes believable demo data for:

- charities
- draw months/statuses
- optional demo users/subscriptions/scores if matching auth users exist:
  - `admin@impactloop.dev`
  - `olivia.member@impactloop.dev`
  - `nathan.member@impactloop.dev`

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Run

```bash
npm install
npm run dev
```

## Apply database setup (Supabase SQL editor)

1. Run `supabase/schema.sql`
2. Run `supabase/seed.sql`

## Quick role setup for admin testing

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@impactloop.dev');
```

## Validation

```bash
npm run lint
npm run build
```
