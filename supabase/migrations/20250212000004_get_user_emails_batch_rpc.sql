-- RPC function to get user emails in batch
-- This allows fetching multiple user emails efficiently

create or replace function public.get_user_emails_batch(user_ids uuid[])
returns table (
  id uuid,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    u.id,
    u.email::text
  from auth.users u
  where u.id = any(user_ids);
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.get_user_emails_batch(uuid[]) to authenticated;

-- Add comment
comment on function public.get_user_emails_batch(uuid[]) is 'Get emails for multiple users by their IDs. Returns user ID and email.';

