-- Generate usernames for existing users from their email addresses
-- Then make username field required

-- Function to generate username from email
-- Extracts the part before @, removes dots and special chars, keeps only alphanumeric, underscores, and hyphens
-- Limits to 30 characters
create or replace function generate_username_from_email(email_address text, user_id uuid)
returns text
language plpgsql
as $$
declare
  base_username text;
  final_username text;
  counter int := 0;
  counter_str text;
begin
  -- Extract part before @
  base_username := lower(split_part(email_address, '@', 1));
  
  -- Remove dots and replace with underscores, then remove invalid characters
  base_username := replace(base_username, '.', '_');
  base_username := regexp_replace(base_username, '[^a-z0-9_-]', '', 'g');
  
  -- Ensure minimum length of 3
  if length(base_username) < 3 then
    base_username := base_username || '_user';
  end if;
  
  -- Limit to 30 characters
  if length(base_username) > 30 then
    base_username := left(base_username, 30);
  end if;
  
  final_username := base_username;
  
  -- Check for uniqueness and append number if needed
  while exists (
    select 1 from public.profiles 
    where username = final_username 
    and id != user_id
  ) loop
    counter := counter + 1;
    counter_str := counter::text;
    -- Append counter, ensuring total length doesn't exceed 30
    if length(base_username) + length(counter_str) + 1 > 30 then
      final_username := left(base_username, 30 - length(counter_str) - 1) || '_' || counter_str;
    else
      final_username := base_username || '_' || counter_str;
    end if;
  end loop;
  
  return final_username;
end;
$$;

-- Update existing profiles with generated usernames
update public.profiles p
set username = generate_username_from_email(u.email, p.id)
from auth.users u
where p.id = u.id
  and p.username is null;

-- Make username required (NOT NULL)
alter table public.profiles
  alter column username set not null;

-- Update the unique index to remove the WHERE clause since username is now required
drop index if exists public.profiles_username_unique_idx;
create unique index profiles_username_unique_idx 
  on public.profiles(username);

-- Update the constraint to remove the null check since it's now required
alter table public.profiles
  drop constraint if exists profiles_username_format_check;

alter table public.profiles
  add constraint profiles_username_format_check 
  check (
    length(username) >= 3 
    and length(username) <= 30 
    and username ~ '^[a-z0-9_-]+$'
  );

-- Drop the temporary function
drop function if exists generate_username_from_email(text, uuid);

-- Add comment
comment on column public.profiles.username is 'Unique username for displaying user identity to others (e.g., in tags, mentions). Must be lowercase alphanumeric with underscores/hyphens, 3-30 characters. Required.';

