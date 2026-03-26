-- ImpactLoop core schema
-- Free-tier friendly: single Postgres schema, RLS-first, no paid extensions required.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('starter', 'standard', 'plus')),
  status text not null default 'inactive' check (status in ('active', 'inactive', 'paused', 'canceled')),
  monthly_amount_cents integer not null check (monthly_amount_cents >= 0),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  played_on date not null,
  course_name text not null,
  stableford_points integer not null check (stableford_points between 0 and 72),
  stableford_class text,
  gross_score integer,
  handicap_index numeric(4,1),
  created_at timestamptz not null default now()
);
create index if not exists scores_user_created_idx on public.scores(user_id, created_at desc);

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_charities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  charity_id uuid not null references public.charities(id),
  allocation_percent integer not null default 20 check (allocation_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  draw_month date not null unique,
  status text not null default 'draft' check (status in ('draft', 'simulated', 'published')),
  rollover_cents integer not null default 0 check (rollover_cents >= 0),
  prize_pool_cents integer not null default 0 check (prize_pool_cents >= 0),
  notes text,
  simulated_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_score_id uuid references public.scores(id) on delete set null,
  ticket_count integer not null default 1 check (ticket_count >= 1),
  created_at timestamptz not null default now(),
  unique(draw_id, user_id)
);
create index if not exists draw_entries_draw_ticket_idx on public.draw_entries(draw_id, ticket_count desc);

create table if not exists public.draw_results (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  tier text not null,
  prize_cents integer not null check (prize_cents >= 0),
  winner_entry_id uuid references public.draw_entries(id) on delete set null,
  winner_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'selected', 'verified', 'paid')),
  created_at timestamptz not null default now(),
  unique(draw_id, tier)
);

create table if not exists public.winner_verifications (
  id uuid primary key default gen_random_uuid(),
  draw_result_id uuid not null unique references public.draw_results(id) on delete cascade,
  verified_by uuid not null references public.profiles(id),
  verified_at timestamptz not null default now(),
  method text not null default 'manual',
  notes text
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  draw_result_id uuid not null unique references public.draw_results(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  processed_by uuid references public.profiles(id),
  paid_at timestamptz,
  reference text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

drop trigger if exists user_charities_set_updated_at on public.user_charities;
create trigger user_charities_set_updated_at before update on public.user_charities for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.scores enable row level security;
alter table public.charities enable row level security;
alter table public.user_charities enable row level security;
alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.draw_results enable row level security;
alter table public.winner_verifications enable row level security;
alter table public.payouts enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
for select using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
for insert with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
for update using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "subscriptions_select" on public.subscriptions;
create policy "subscriptions_select" on public.subscriptions
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "subscriptions_write" on public.subscriptions;
create policy "subscriptions_write" on public.subscriptions
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "scores_select" on public.scores;
create policy "scores_select" on public.scores
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "scores_insert" on public.scores;
create policy "scores_insert" on public.scores
for insert with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "scores_update_delete" on public.scores;
create policy "scores_update_delete" on public.scores
for update using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "scores_delete" on public.scores;
create policy "scores_delete" on public.scores
for delete using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "charities_select" on public.charities;
create policy "charities_select" on public.charities
for select to authenticated using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "charities_write" on public.charities;
create policy "charities_write" on public.charities
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "user_charities_select" on public.user_charities;
create policy "user_charities_select" on public.user_charities
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "user_charities_write" on public.user_charities;
create policy "user_charities_write" on public.user_charities
for insert with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "user_charities_update" on public.user_charities;
create policy "user_charities_update" on public.user_charities
for update using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "draws_select" on public.draws;
create policy "draws_select" on public.draws
for select to authenticated using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "draws_write" on public.draws;
create policy "draws_write" on public.draws
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "draw_entries_select" on public.draw_entries;
create policy "draw_entries_select" on public.draw_entries
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "draw_entries_write" on public.draw_entries;
create policy "draw_entries_write" on public.draw_entries
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "draw_results_select" on public.draw_results;
create policy "draw_results_select" on public.draw_results
for select to authenticated using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.draws d
    where d.id = draw_id and d.status = 'published'
  )
);

drop policy if exists "draw_results_write" on public.draw_results;
create policy "draw_results_write" on public.draw_results
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "winner_verifications_select" on public.winner_verifications;
create policy "winner_verifications_select" on public.winner_verifications
for select using (public.is_admin(auth.uid()));

drop policy if exists "winner_verifications_write" on public.winner_verifications;
create policy "winner_verifications_write" on public.winner_verifications
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "payouts_select" on public.payouts;
create policy "payouts_select" on public.payouts
for select using (public.is_admin(auth.uid()));

drop policy if exists "payouts_write" on public.payouts;
create policy "payouts_write" on public.payouts
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
