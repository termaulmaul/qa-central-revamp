-- QA Central Revamp — Authentication schema
-- Idempotent. Creates the role enum, the profiles table, RLS policies,
-- an auto-provision trigger, and a SECURITY DEFINER resolver used for
-- username -> email login. Safe to run on a fresh or existing database.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- role enum
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('god', 'admin', 'qa', 'developer', 'viewer');
  end if;
end $$;

-- Ensure every expected value exists even if the enum predates this file.
alter type public.user_role add value if not exists 'god';
alter type public.user_role add value if not exists 'admin';
alter type public.user_role add value if not exists 'qa';
alter type public.user_role add value if not exists 'developer';
alter type public.user_role add value if not exists 'viewer';

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique,
  display_name text,
  role         public.user_role not null default 'viewer',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Reconcile a legacy table that used `full_name` instead of `display_name`.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
  ) then
    alter table public.profiles rename column full_name to display_name;
  end if;
end $$;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

comment on table public.profiles is 'Application user profiles linked 1:1 to auth.users.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserts are performed by the SECURITY DEFINER trigger below, so no INSERT
-- policy is granted to end users.

-- ---------------------------------------------------------------------------
-- keep updated_at fresh
-- ---------------------------------------------------------------------------
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
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auto-provision a profile row whenever an auth user is created.
-- Reads username / display_name / role from raw_user_meta_data.
-- Exception-safe: profile provisioning must never block auth signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username'),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'viewer')
  )
  on conflict (id) do update
    set username     = excluded.username,
        display_name = excluded.display_name,
        role         = excluded.role,
        updated_at   = now();
  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: % (%)', new.id, sqlerrm, sqlstate;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- username -> email resolver
-- The login flow submits a username; the server resolves the associated auth
-- email, then calls signInWithPassword with that email. SECURITY DEFINER so it
-- can read auth.users; returns only the email string.
-- ---------------------------------------------------------------------------
create or replace function public.email_for_username(uname text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(trim(uname))
  limit 1;
$$;

revoke all on function public.email_for_username(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;
