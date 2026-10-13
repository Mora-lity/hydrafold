
-- HydraFold Web Push
-- Tables for devices, subscriptions, schedules and delivery tracking.

create extension if not exists pgcrypto;

-- 1. Registered browser devices
create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  device_token_hash text not null unique
    check (length(device_token_hash) = 64),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- 2. Web Push subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.push_devices(id)
    on delete cascade,
  endpoint text not null,
  expiration_time bigint,
  keys jsonb not null,
  active boolean not null default true,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_id, endpoint),
  check (jsonb_typeof(keys) = 'object')
);

-- 3. User reminder schedules
-- JavaScript weekday values: Sunday=0 through Saturday=6.
create table if not exists public.push_schedules (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.push_devices(id)
    on delete cascade,
  "time" text not null
    check ("time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  days smallint[] not null
    check (
      cardinality(days) between 1 and 7
      and days <@ array[0,1,2,3,4,5,6]::smallint[]
    ),
  timezone text not null
    check (length(timezone) between 1 and 64),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. One delivery record per schedule occurrence
create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.push_schedules(id)
    on delete cascade,
  device_id uuid not null references public.push_devices(id)
    on delete cascade,
  local_date date not null,
  local_time text not null
    check (local_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  timezone text not null,
  status text not null default 'pending'
    check (status in (
      'pending', 'processing', 'sent', 'retryable', 'failed'
    )),
  attempt_count integer not null default 0
    check (attempt_count >= 0),
  max_attempts integer not null default 5
    check (max_attempts > 0),
  claim_token uuid,
  claim_until timestamptz,
  last_attempt_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (schedule_id, local_date, local_time, timezone)
);

-- 5. Track delivery separately for each subscription
create table if not exists public.push_delivery_targets (
  delivery_id uuid not null references public.push_deliveries(id)
    on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id)
    on delete cascade,
  endpoint text not null,
  status text not null default 'pending'
    check (status in (
      'pending', 'processing', 'sent', 'retryable', 'failed'
    )),
  attempt_count integer not null default 0
    check (attempt_count >= 0),
  claim_token uuid,
  claim_until timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (delivery_id, subscription_id)
);

-- Indexes used by API requests and scheduler
create index if not exists idx_push_subscriptions_device_active
  on public.push_subscriptions (device_id, active);

create index if not exists idx_push_schedules_active
  on public.push_schedules (active, device_id);

create index if not exists idx_push_deliveries_status_attempts
  on public.push_deliveries (status, attempt_count, created_at);

create index if not exists idx_push_delivery_targets_status
  on public.push_delivery_targets (delivery_id, status);

-- Keep browser clients away from push data.
alter table public.push_devices enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_schedules enable row level security;
alter table public.push_deliveries enable row level security;
alter table public.push_delivery_targets enable row level security;

revoke all on public.push_devices from anon, authenticated;
revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.push_schedules from anon, authenticated;
revoke all on public.push_deliveries from anon, authenticated;
revoke all on public.push_delivery_targets from anon, authenticated;

grant select, insert, update, delete
  on public.push_devices to service_role;
grant select, insert, update, delete
  on public.push_subscriptions to service_role;
grant select, insert, update, delete
  on public.push_schedules to service_role;
grant select, insert, update, delete
  on public.push_deliveries to service_role;
grant select, insert, update, delete
  on public.push_delivery_targets to service_role;
