-- Demo charities
insert into public.charities (name, description, is_active)
values
  ('First Tee Youth Fund', 'Supports junior golf access and coaching.' , true),
  ('Community Greens Program', 'Keeps local golf facilities affordable and open.', true),
  ('Adaptive Fairways Trust', 'Expands adaptive equipment and inclusive training.', true)
on conflict (name) do nothing;

-- Demo draw months
insert into public.draws (draw_month, status, rollover_cents, prize_pool_cents, notes)
values
  ('2026-01-01', 'published', 5000, 120000, 'Published draw for January.'),
  ('2026-02-01', 'simulated', 8000, 132500, 'Awaiting admin publication.'),
  ('2026-03-01', 'draft', 8000, 0, 'Draft draw, entries pending.')
on conflict (draw_month) do nothing;

-- Optional demo users (run after creating auth users with these emails)
with demo_users as (
  select id, email from auth.users where email in (
    'admin@impactloop.dev',
    'olivia.member@impactloop.dev',
    'nathan.member@impactloop.dev'
  )
)
insert into public.profiles (id, full_name, role)
select
  id,
  case
    when email = 'admin@impactloop.dev' then 'Ava Admin'
    when email = 'olivia.member@impactloop.dev' then 'Olivia Hart'
    else 'Nathan Cole'
  end,
  case when email = 'admin@impactloop.dev' then 'admin' else 'user' end
from demo_users
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role;

insert into public.subscriptions (user_id, plan, status, monthly_amount_cents, starts_on)
select p.id,
  case when p.role = 'admin' then 'plus' else 'standard' end,
  'active',
  case when p.role = 'admin' then 4900 else 2900 end,
  current_date - interval '90 days'
from public.profiles p
where p.id in (
  select id from auth.users where email in (
    'admin@impactloop.dev',
    'olivia.member@impactloop.dev',
    'nathan.member@impactloop.dev'
  )
)
on conflict (user_id) do nothing;

insert into public.user_charities (user_id, charity_id, allocation_percent)
select p.id, c.id, 20
from public.profiles p
cross join lateral (
  select id from public.charities order by name asc limit 1
) c
where p.id in (
  select id from auth.users where email in (
    'admin@impactloop.dev',
    'olivia.member@impactloop.dev',
    'nathan.member@impactloop.dev'
  )
)
on conflict (user_id) do nothing;

insert into public.scores (user_id, played_on, course_name, stableford_points, stableford_class, gross_score, handicap_index)
select p.id, current_date - interval '14 days', 'Ridgeway Links', 36, 'B', 88, 17.2
from public.profiles p
where p.id in (
  select id from auth.users where email in (
    'olivia.member@impactloop.dev',
    'nathan.member@impactloop.dev'
  )
)
on conflict do nothing;
