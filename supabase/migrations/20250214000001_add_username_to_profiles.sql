-- Add username field to profiles table
-- Username is required and unique, used for displaying user identity to others

alter table public.profiles
  add column if not exists username text;

-- Create unique index on username (null values are allowed initially for existing users)
create unique index if not exists profiles_username_unique_idx 
  on public.profiles(username) 
  where username is not null;

-- Add constraint to ensure username is lowercase and alphanumeric with underscores/hyphens
-- Username must be between 3 and 30 characters
alter table public.profiles
  add constraint profiles_username_format_check 
  check (
    username is null 
    or (
      length(username) >= 3 
      and length(username) <= 30 
      and username ~ '^[a-z0-9_-]+$'
    )
  );

-- Add comment
comment on column public.profiles.username is 'Unique username for displaying user identity to others (e.g., in tags, mentions). Must be lowercase alphanumeric with underscores/hyphens, 3-30 characters.';

