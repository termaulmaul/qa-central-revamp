-- QA Central Revamp — Per-user settings
-- Idempotent. Stores a single JSONB blob of app settings (theme, LLM config,
-- Qase config, QA guidelines) per authenticated user. RLS-scoped so each user
-- can only read and write their own row. Safe to run on a fresh or existing db.

create table if not exists public.user_settings (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

-- Each user may read only their own settings row.
drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own
  on public.user_settings
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Each user may insert only a row keyed to their own id.
drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own
  on public.user_settings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Each user may update only their own row.
drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own
  on public.user_settings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at fresh on every write.
create or replace function public.touch_user_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
  before update on public.user_settings
  for each row execute function public.touch_user_settings_updated_at();

notify pgrst, 'reload schema';
