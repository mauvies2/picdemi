-- Ensure enum type exists
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('PHOTOGRAPHER', 'MODEL');
  end if;
end
$$;

-- Profiles table with active role
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  active_role public.user_role not null default 'PHOTOGRAPHER',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Ensure bio column exists (for existing deployments)
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'bio'
  ) then
    alter table public.profiles add column bio text;
  end if;
end
$$;

-- Ensure active_role column exists
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'active_role'
  ) then
    alter table public.profiles
      add column active_role public.user_role not null default 'PHOTOGRAPHER';
  end if;
end
$$;

-- Ensure active_role uses the enum
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'active_role'
      and udt_name <> 'user_role'
  ) then
    alter table public.profiles
      alter column active_role type public.user_role
      using coalesce(upper(active_role), 'PHOTOGRAPHER')::public.user_role;
  end if;
end
$$;

update public.profiles
set active_role = 'PHOTOGRAPHER'
where active_role is null;

-- Trigger to keep updated_at fresh
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

-- User roles table
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null,
  enabled_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

-- Harmonise pre-existing user_roles schema
alter table public.user_roles drop constraint if exists user_roles_role_check;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'user_roles'
      and constraint_type = 'PRIMARY KEY'
      and constraint_name = 'user_roles_pkey'
  ) then
    alter table public.user_roles drop constraint user_roles_pkey;
  end if;
exception
  when undefined_table then
    null;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'user_roles_user_id_key'
      and conrelid = 'public.user_roles'::regclass
  ) then
    alter table public.user_roles drop constraint user_roles_user_id_key;
  end if;
exception
  when undefined_table then
    null;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_roles'
      and column_name = 'id'
  ) then
    alter table public.user_roles drop column id;
  end if;
exception
  when undefined_table then
    null;
end
$$;

-- Ensure role column uses enum for existing deployments
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_roles'
      and column_name = 'role'
      and udt_name <> 'user_role'
  ) then
    alter table public.user_roles
      alter column role type public.user_role
      using coalesce(upper(role), 'PHOTOGRAPHER')::public.user_role;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_roles'
      and column_name = 'created_at'
  ) then
    alter table public.user_roles rename column created_at to enabled_at;
  end if;
exception
  when undefined_table then
    null;
end
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_roles'
      and column_name = 'enabled_at'
  ) then
    alter table public.user_roles
      add column enabled_at timestamptz not null default timezone('utc', now());
  else
    alter table public.user_roles
      alter column enabled_at set default timezone('utc', now());
  end if;
end
$$;

-- Remove duplicate rows before applying composite primary key
with duplicates as (
  select ctid,
         row_number() over (partition by user_id, role order by enabled_at desc) as rn
  from public.user_roles
)
delete from public.user_roles
where ctid in (select ctid from duplicates where rn > 1);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'user_roles'
      and constraint_type = 'PRIMARY KEY'
  ) then
    alter table public.user_roles
      add primary key (user_id, role);
  end if;
end
$$;

-- RLS policies
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

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
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'user_roles_self_all'
  ) then
    create policy user_roles_self_all
      on public.user_roles
      for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end
$$;

-- Backfill existing users: ensure at least PHOTOGRAPHER role exists
insert into public.user_roles (user_id, role)
select id, 'PHOTOGRAPHER'
from public.profiles
on conflict do nothing;

insert into public.profiles (id, active_role)
select user_id, 'PHOTOGRAPHER'
from public.user_roles
on conflict (id) do nothing;

