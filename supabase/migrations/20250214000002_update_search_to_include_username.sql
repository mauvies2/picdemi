-- Update search_users_by_text to also search by username
-- This allows searching users by username, email, or display name

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
    or lower(coalesce(p.username, '')) like '%' || lower(search_text) || '%'
  order by
    case 
      when lower(coalesce(p.username, '')) = lower(search_text) then 1
      when lower(coalesce(p.username, '')) like lower(search_text) || '%' then 2
      when lower(u.email) = lower(search_text) then 3
      when lower(u.email) like lower(search_text) || '%' then 4
      when lower(coalesce(p.display_name, '')) like lower(search_text) || '%' then 5
      else 6
    end,
    coalesce(p.username, u.email)
  limit result_limit;
end;
$$;

-- Update comment
comment on function public.search_users_by_text(text, int) is 'Search for users by username, email, or display name (partial match). Returns user ID, email, and display name. Prioritizes username matches.';

