# ImpactLoop

## Product overview
ImpactLoop is a subscription-based golf impact platform with three clear surfaces:
- Public site (`/`, `/pricing`)
- Member app (`/dashboard`, `/settings`)
- Admin operations console (`/admin`)

Members manage subscription visibility, score history (latest five), charity allocation, and draw/payout visibility. Admins run moderation, simulate/publish draws, verify winners, and track payouts.

## Tech stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth (email/password)
- Supabase Postgres + RLS
- Zod for server-side validation

## Setup
1. Install dependencies:
   - `npm install`
2. Copy env:
   - `cp .env.example .env.local`
3. Set env values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (local: `http://localhost:3000`)
   - `SUPABASE_SERVICE_ROLE_KEY`
4. In Supabase SQL Editor run:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
5. Start app:
   - `npm run dev`

## Test flow (quick reviewer path)
1. Create two users in app:
   - `admin@impactloop.dev`
   - `member@impactloop.dev`
2. Promote admin in SQL:
```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@impactloop.dev');
```
3. Sign in as member:
   - Add scores, confirm only latest five persist
   - Select charity and confirm dashboard updates
4. Sign in as admin:
   - Update subscription/status
   - Simulate draw for a month
   - Publish simulated draw
   - Approve/reject winner and update payout status
5. Verify non-admin cannot access `/admin`.

## Deployment notes
### Vercel Hobby
- Import repo and deploy with default Next.js settings.
- Add all env vars from `.env.local`.

### Supabase Free
- Create project, enable email/password auth.
- Run schema + seed scripts.
- Use SQL role update for admin reviewer account.

## Validation commands
- `npm run lint`
- `npm run build`
