-- Create shared enum if missing
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('PHOTOGRAPHER', 'MODEL');
  end if;
end
$$;

-- Ensure profiles table exists (schema already present in project)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  active_role public.user_role not null default 'PHOTOGRAPHER',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Add optional columns when missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'bio'
  ) then
    alter table public.profiles add column bio text;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'active_role'
  ) then
    alter table public.profiles
      add column active_role public.user_role not null default 'PHOTOGRAPHER';
  end if;
end
$$;

update public.profiles
set active_role = 'PHOTOGRAPHER'
where active_role is null;

-- Trigger to keep profiles.updated_at current
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- New memberships table (allows multiple roles per user)
create table if not exists public.user_role_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null,
  enabled_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_roles'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'user_roles'
        and column_name = 'created_at'
    ) then
      execute $ins$
        insert into public.user_role_memberships (user_id, role, enabled_at)
        select
          user_id,
          case
            when role::text = 'MODEL' then 'MODEL'::public.user_role
            else 'PHOTOGRAPHER'::public.user_role
          end,
          coalesce(created_at, timezone('utc', now()))
        from public.user_roles
        on conflict do nothing
      $ins$;
    else
      execute $ins$
        insert into public.user_role_memberships (user_id, role, enabled_at)
        select
          user_id,
          case
            when role::text = 'MODEL' then 'MODEL'::public.user_role
            else 'PHOTOGRAPHER'::public.user_role
          end,
          timezone('utc', now())
        from public.user_roles
        on conflict do nothing
      $ins$;
    end if;
  end if;
end
$$;

-- Guarantee every profile has at least PHOTOGRAPHER membership
insert into public.user_role_memberships (user_id, role)
select id, 'PHOTOGRAPHER'
from public.profiles
on conflict do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_role_memberships enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_self_select'
  ) then
    create policy profiles_self_select
      on public.profiles
      for select
      using (id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_self_update'
  ) then
    create policy profiles_self_update
      on public.profiles
      for update
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_self_insert'
  ) then
    create policy profiles_self_insert
      on public.profiles
      for insert
      with check (id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_role_memberships'
      and policyname = 'user_role_memberships_self_all'
  ) then
    create policy user_role_memberships_self_all
      on public.user_role_memberships
      for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end
$$;

