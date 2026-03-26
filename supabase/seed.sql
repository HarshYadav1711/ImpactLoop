insert into public.subscription_plans (name, monthly_amount_cents)
values ('Standard', 2500), ('Plus', 4500)
on conflict (name) do nothing;

insert into public.charities (name, description)
values
('First Tee Youth Fund', 'Supports youth golf access and after-school development.'),
('Community Greens Program', 'Maintains affordable local course access and upkeep.'),
('Open Fairways Initiative', 'Funds adaptive golf access and inclusion coaching.')
on conflict (name) do nothing;
