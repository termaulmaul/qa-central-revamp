-- QA Central Revamp — Admin-managed user role updates
-- Lets a 'god'/'admin' user change another user's role without weakening the
-- profiles RLS policy (which stays self-only for direct UPDATE). The
-- function checks the caller's own role server-side via auth.uid(), so it is
-- safe to expose to any authenticated caller. Creating/disabling accounts
-- still requires the Supabase Admin API (service role key), which is not
-- configured in this environment — the User Management module surfaces that
-- as a clear limitation rather than silently failing.
-- Idempotent. Safe to run on a fresh or existing database.

create or replace function public.admin_update_user_role(target_id uuid, new_role public.user_role)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role public.user_role;
  updated public.profiles;
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is null or caller_role not in ('god', 'admin') then
    raise exception 'not authorized';
  end if;

  update public.profiles set role = new_role, updated_at = now()
  where id = target_id
  returning * into updated;

  if updated.id is null then
    raise exception 'user not found';
  end if;

  return updated;
end;
$$;

revoke all on function public.admin_update_user_role(uuid, public.user_role) from public;
grant execute on function public.admin_update_user_role(uuid, public.user_role) to authenticated;

notify pgrst, 'reload schema';
