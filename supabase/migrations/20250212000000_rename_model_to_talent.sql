-- Step 2: Update existing MODEL records to TALENT
-- This migration runs after 20250212000001_add_talent_enum.sql
-- which ensures TALENT is committed and available for use

-- Update all existing MODEL values to TALENT in profiles table
update public.profiles
set active_role = 'TALENT'::public.user_role
where active_role::text = 'MODEL';

-- Update all existing MODEL values to TALENT in user_role_memberships table
update public.user_role_memberships
set role = 'TALENT'::public.user_role
where role::text = 'MODEL';

-- Note: We don't remove MODEL from the enum to avoid breaking existing constraints
-- The enum will still contain MODEL but new records should use TALENT

