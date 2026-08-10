-- QA Central Revamp — Legacy module data layer (dev/local data store)
-- ---------------------------------------------------------------------------
-- Backs the modules ported from qa-central-dashboard whose original data
-- lived in Oracle (PT_* tables). This laptop has no network path to that
-- Oracle instance, so these tables reuse the Supabase Postgres project
-- already wired up for auth, as the working local/dev data layer.
--
-- ceiling: no Oracle connectivity from this environment.
-- upgrade: when deployed somewhere that can reach the real Oracle user DB,
-- swap the repository implementations in src/server/db/repositories/ to the
-- oracledb-backed versions with identical function signatures — routes and
-- UI do not need to change.
--
-- These tables are shared operational/app data, not per-user private data
-- (mirrors the reference architecture, where PT_* tables had no row-level
-- security — access was gated by the Node server's own session/role check,
-- not the database). Access here is likewise gated at the app layer via
-- requireAuth()/role checks in Next.js route handlers, so RLS policies are
-- intentionally permissive rather than per-row.
-- Idempotent. Safe to run on a fresh or existing database.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- helper: keep updated_at fresh (reuses public.set_updated_at from 0001)
-- ---------------------------------------------------------------------------

create table if not exists public.pt_projects (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  base_url     text,
  environment  text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.pt_scripts (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.pt_projects (id) on delete cascade,
  name         text not null,
  path         text not null,
  tags         text[] not null default '{}',
  updated_at   timestamptz not null default now()
);

create table if not exists public.pt_settings (
  project_id   uuid references public.pt_projects (id) on delete cascade,
  key          text not null,
  value        jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  primary key (project_id, key)
);

create table if not exists public.pt_queue_jobs (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.pt_projects (id) on delete set null,
  script       text not null,
  status       text not null default 'queued',
  payload      jsonb not null default '{}'::jsonb,
  result       jsonb,
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  finished_at  timestamptz
);

create table if not exists public.pt_cron_schedules (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.pt_projects (id) on delete cascade,
  name         text not null,
  cron_expr    text not null,
  script       text not null,
  enabled      boolean not null default true,
  last_run_at  timestamptz,
  next_run_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists public.pt_run_history (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.pt_projects (id) on delete set null,
  script       text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  verdict      text,
  metrics      jsonb not null default '{}'::jsonb
);

create table if not exists public.pt_webhooks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.pt_projects (id) on delete cascade,
  url          text not null,
  events       text[] not null default '{}',
  enabled      boolean not null default true,
  secret       text,
  created_at   timestamptz not null default now()
);

create table if not exists public.pt_api_catalog (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.pt_projects (id) on delete cascade,
  method       text not null,
  path         text not null,
  tags         text[] not null default '{}',
  spec         jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

create table if not exists public.pt_module_access (
  id           uuid primary key default gen_random_uuid(),
  role_code    text not null,
  module_id    text not null,
  allowed      boolean not null default true,
  unique (role_code, module_id)
);

create table if not exists public.pt_jenkins_jobs_cache (
  id           uuid primary key default gen_random_uuid(),
  job_name     text not null unique,
  status       text,
  last_build   jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

create table if not exists public.pt_regression_platforms (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  config       jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.pt_regression_runs (
  id           uuid primary key default gen_random_uuid(),
  platform_id  uuid references public.pt_regression_platforms (id) on delete set null,
  status       text not null default 'scheduled',
  started_at   timestamptz,
  finished_at  timestamptz,
  summary      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.pt_regression_failures (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid references public.pt_regression_runs (id) on delete cascade,
  test_name      text not null,
  classification text,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create table if not exists public.pt_regression_schedules (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  cron_expr    text not null,
  platform_id  uuid references public.pt_regression_platforms (id) on delete cascade,
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.pt_device_health_snapshots (
  id           uuid primary key default gen_random_uuid(),
  platform     text not null check (platform in ('android', 'ios')),
  device_id    text not null,
  status       text not null default 'unknown',
  metrics      jsonb not null default '{}'::jsonb,
  recorded_at  timestamptz not null default now()
);

create table if not exists public.pt_burst_orders (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  config       jsonb not null default '{}'::jsonb,
  status       text not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.pt_test_reports (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.pt_projects (id) on delete set null,
  name         text not null,
  summary      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.pt_audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor        text not null,
  action       text not null,
  target       text,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security — permissive by design (see header comment)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'pt_projects','pt_scripts','pt_settings','pt_queue_jobs','pt_cron_schedules',
      'pt_run_history','pt_webhooks','pt_api_catalog','pt_module_access',
      'pt_jenkins_jobs_cache','pt_regression_platforms','pt_regression_runs',
      'pt_regression_failures','pt_regression_schedules','pt_device_health_snapshots',
      'pt_burst_orders','pt_test_reports','pt_audit_log'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I_app_access on public.%I', t, t);
    execute format(
      'create policy %I_app_access on public.%I for all to anon, authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

notify pgrst, 'reload schema';
