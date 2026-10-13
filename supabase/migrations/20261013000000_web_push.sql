-- HydraFold Web Push schema for existing project cogrlgrcgwfntzkgoigl.
-- Review only: this file is intentionally not executed by v0.
create extension if not exists pgcrypto;

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  device_token text not null unique check (length(device_token) between 32 and 256),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.push_devices(id) on delete cascade,
  endpoint text not null,
  expiration_time bigint,
  keys jsonb not null check (keys ? 'p256dh' and keys ? 'auth'),
  active boolean not null default true,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_id, endpoint)
);

create table if not exists public.push_schedules (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.push_devices(id) on delete cascade,
  time time not null,
  days smallint[] not null check (cardinality(days) between 1 and 7 and days <@ array[0,1,2,3,4,5,6]::smallint[]),
  timezone text not null check (length(timezone) between 1 and 64),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.push_schedules(id) on delete cascade,
  device_id uuid not null references public.push_devices(id) on delete cascade,
  local_date date not null,
  local_time time not null,
  timezone text not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','retryable','failed')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  max_attempts integer not null default 5 check (max_attempts between 1 and 10),
  claim_token uuid,
  claim_until timestamptz,
  last_attempt_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (schedule_id, local_date, local_time, timezone)
);

create table if not exists public.push_delivery_targets (
  delivery_id uuid not null references public.push_deliveries(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  endpoint text not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','retryable','failed')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 10),
  claim_token uuid,
  claim_until timestamptz,
  last_error text,
  sent_at timestamptz,
  primary key (delivery_id, subscription_id)
);

create table if not exists public.push_scheduler_cursor (
  id boolean primary key default true check (id),
  cursor_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.push_scheduler_cursor(id) values (true) on conflict (id) do nothing;

create index if not exists push_deliveries_due_idx on public.push_deliveries(status, claim_until, last_attempt_at);
create index if not exists push_subscriptions_device_idx on public.push_subscriptions(device_id, active);
create index if not exists push_schedules_active_idx on public.push_schedules(active, device_id);

alter table public.push_devices enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_schedules enable row level security;
alter table public.push_deliveries enable row level security;
alter table public.push_delivery_targets enable row level security;
alter table public.push_scheduler_cursor enable row level security;

-- Server-only role: Supabase's built-in service_role is used by the HTTPS server.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
revoke all on public.push_devices, public.push_subscriptions, public.push_schedules, public.push_deliveries, public.push_delivery_targets, public.push_scheduler_cursor from anon, authenticated;
grant select, insert, update on public.push_devices, public.push_subscriptions, public.push_schedules, public.push_deliveries, public.push_delivery_targets, public.push_scheduler_cursor to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.claim_push_delivery(p_claim_ttl interval, p_max_attempts integer)
returns table (delivery_id uuid, claim_token uuid, device_id uuid, schedule_id uuid, attempt_count integer)
language plpgsql security invoker set search_path = public
as $$
declare v_token uuid := gen_random_uuid();
begin
  if p_claim_ttl <= interval '0 seconds' or p_max_attempts < 1 or p_max_attempts > 10 then raise exception 'invalid claim parameters'; end if;
  return query
  update public.push_deliveries d set status='processing', claim_token=v_token,
    claim_until=clock_timestamp()+p_claim_ttl, attempt_count=d.attempt_count+1, last_attempt_at=clock_timestamp()
  where d.id = (select x.id from public.push_deliveries x join public.push_devices dv on dv.id=x.device_id and dv.active
    join public.push_schedules s on s.id=x.schedule_id and s.active
    where x.attempt_count < least(x.max_attempts,p_max_attempts)
      and (x.status in ('pending','retryable') or (x.status='processing' and x.claim_until < clock_timestamp()))
    order by x.local_date, x.local_time, x.id for update skip locked limit 1)
  returning d.id, d.claim_token, d.device_id, d.schedule_id, d.attempt_count;
end $$;

create or replace function public.claim_push_targets(p_delivery_id uuid, p_claim_ttl interval)
returns table (subscription_id uuid, endpoint text, keys jsonb, claim_token uuid)
language plpgsql security invoker set search_path = public
as $$
declare v_token uuid := gen_random_uuid();
begin
  if p_claim_ttl <= interval '0 seconds' then raise exception 'invalid claim ttl'; end if;
  return query
  update public.push_delivery_targets t set status='processing', claim_token=v_token,
    claim_until=clock_timestamp()+p_claim_ttl, attempt_count=t.attempt_count+1
  where t.ctid in (select x.ctid from public.push_delivery_targets x join public.push_subscriptions s on s.id=x.subscription_id and s.active
    join public.push_devices d on d.id=s.device_id and d.active
    where x.delivery_id=p_delivery_id and x.attempt_count < 10 and (x.status in ('pending','retryable') or (x.status='processing' and x.claim_until < clock_timestamp()))
    for update skip locked)
  returning t.subscription_id, t.endpoint, (select s.keys from public.push_subscriptions s where s.id=t.subscription_id), t.claim_token;
end $$;

grant execute on function public.claim_push_delivery(interval, integer), public.claim_push_targets(uuid, interval) to service_role;
revoke execute on function public.claim_push_delivery(interval, integer), public.claim_push_targets(uuid, interval) from anon, authenticated;
