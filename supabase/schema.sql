-- ImpactLoop schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  monthly_amount_cents int not null check (monthly_amount_cents > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null check (status in ('active', 'paused', 'canceled')),
  starts_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_charity_selections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  charity_id uuid not null references public.charities(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  played_on date not null,
  course_name text not null,
  stableford_points int not null check (stableford_points >= 0),
  gross_score int,
  handicap_index numeric(4,1),
  created_at timestamptz not null default now()
);
create index if not exists scores_user_created_idx on public.scores(user_id, created_at desc);

create table if not exists public.charity_allocations (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  charity_id uuid not null references public.charities(id),
  amount_cents int not null check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  unique(month, user_id)
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  month date not null unique,
  status text not null check (status in ('draft','simulated','published')) default 'draft',
  rollover_cents int not null default 0,
  prize_pool_cents int not null default 0,
  algorithm_note text,
  simulated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.draw_results (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  tier_name text not null,
  amount_cents int not null check (amount_cents >= 0),
  winner_user_id uuid references public.profiles(id),
  winner_score_id uuid references public.scores(id),
  verified boolean not null default false,
  payout_status text not null default 'pending' check (payout_status in ('pending','paid')),
  created_at timestamptz not null default now(),
  unique(draw_id, tier_name)
);

alter table public.profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.charities enable row level security;
alter table public.user_charity_selections enable row level security;
alter table public.scores enable row level security;
alter table public.charity_allocations enable row level security;
alter table public.draws enable row level security;
alter table public.draw_results enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'admin');
$$;

create policy "profiles self read" on public.profiles for select using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "plans read all" on public.subscription_plans for select using (true);
create policy "plans admin write" on public.subscription_plans for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "subscriptions self read" on public.subscriptions for select using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "subscriptions self write" on public.subscriptions for insert with check (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "subscriptions self update" on public.subscriptions for update using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "charities read all" on public.charities for select using (true);
create policy "charities admin write" on public.charities for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "charity selection self" on public.user_charity_selections for all
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "scores self read" on public.scores for select using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "scores self write" on public.scores for insert with check (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "scores self update" on public.scores for update using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "scores self delete" on public.scores for delete using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "allocations self read" on public.charity_allocations for select using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "allocations admin write" on public.charity_allocations for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "draws authenticated read" on public.draws for select to authenticated using (true);
create policy "draws admin write" on public.draws for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "results authenticated read" on public.draw_results for select to authenticated using (true);
create policy "results admin write" on public.draw_results for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
