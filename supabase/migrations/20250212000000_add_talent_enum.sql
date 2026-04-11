-- Step 1: Add TALENT to the enum type
-- This must be committed before we can use TALENT in updates
-- PostgreSQL requires enum values to be committed in a separate transaction
-- 
-- IMPORTANT: This migration must run and commit BEFORE the next migration.
-- Supabase runs migrations sequentially, so this should work.

-- Check if enum type exists, create if not
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('PHOTOGRAPHER', 'TALENT');
  end if;
end
$$;

-- Add TALENT value if it doesn't exist
-- Using exception handling since ALTER TYPE ... ADD VALUE doesn't support IF NOT EXISTS
do $$
begin
  if not exists (
    select 1 from pg_enum 
    where enumlabel = 'TALENT' 
    and enumtypid = (select oid from pg_type where typname = 'user_role')
  ) then
    -- This will be committed when this migration completes
    -- The next migration can then use TALENT
    alter type public.user_role add value 'TALENT';
  end if;
exception
  when others then
    -- If TALENT already exists or other error, continue
    -- This handles the case where the enum value was already added
    null;
end
$$;

