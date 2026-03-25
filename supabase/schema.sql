-- Manas App — Supabase Schema
-- Run this in the Supabase SQL editor before using the app.
--
-- IMPORTANT: The test account uses password "12345" (5 chars).
-- Go to Supabase Dashboard → Authentication → Settings → Password minimum length
-- and set it to 5 (or lower) for the auto-provisioning to work.

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  plan text not null default 'free',
  mood_baseline int,
  goals text[],
  preferred_time text,
  experience_level text,
  theme text not null default 'dark',
  wellness_minutes int not null default 0,
  onboarding_complete boolean not null default false,
  celebrated_milestones text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own row"
  on public.profiles for all
  using (auth.uid() = id);

-- Auto-create a profile row when a user signs up.
-- Uses exception handling so a missing profiles table never blocks auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  begin
    insert into public.profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  exception when others then
    null; -- silently ignore; profiles table may not exist yet
  end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── mood_logs ────────────────────────────────────────────────────────────────
create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_date date not null,
  mood int not null check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, logged_date)
);

alter table public.mood_logs enable row level security;

create policy "mood_logs: own rows"
  on public.mood_logs for all
  using (auth.uid() = user_id);
