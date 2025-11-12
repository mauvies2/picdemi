-- RPC function to search users by email or display name for talent tagging
-- This allows searching auth.users without exposing the full users table
-- Supports partial matching on email and display name

create or replace function public.search_users_by_text(search_text text, result_limit int default 10)
returns table (
  id uuid,
  email text,
  display_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    u.id,
    u.email::text,
    coalesce(p.display_name, '')::text as display_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where 
    lower(u.email) like '%' || lower(search_text) || '%'
    or lower(coalesce(p.display_name, '')) like '%' || lower(search_text) || '%'
  order by
    case 
      when lower(u.email) = lower(search_text) then 1
      when lower(u.email) like lower(search_text) || '%' then 2
      when lower(coalesce(p.display_name, '')) like lower(search_text) || '%' then 3
      else 4
    end,
    u.email
  limit result_limit;
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.search_users_by_text(text, int) to authenticated;

-- Add comment
comment on function public.search_users_by_text(text, int) is 'Search for users by email or display name (partial match). Returns user ID, email, and display name.';

-- Keep the old function for backward compatibility
create or replace function public.search_user_by_email(search_email text)
returns table (
  id uuid,
  email text,
  display_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select * from public.search_users_by_text(search_email, 1);
end;
$$;

grant execute on function public.search_user_by_email(text) to authenticated;

