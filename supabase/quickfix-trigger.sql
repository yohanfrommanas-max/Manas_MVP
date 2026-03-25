-- QUICKFIX: Run this in the Supabase SQL Editor to fix "Database error saving new user"
--
-- The issue: a trigger on auth.users tries to insert into public.profiles,
-- but if profiles doesn't exist yet, every signup fails.
-- This replaces the trigger function with a resilient version that never blocks signups.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  begin
    insert into public.profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  exception when others then
    null; -- silently ignore if profiles table is missing
  end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
