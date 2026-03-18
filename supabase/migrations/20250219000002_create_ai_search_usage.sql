-- Create ai_search_usage table for tracking and rate limiting AI searches
-- Tracks monthly usage per user for subscription-based rate limiting

create table if not exists public.ai_search_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Usage tracking
  search_count int not null default 1 check (search_count > 0),
  
  -- Monthly period tracking (YYYY-MM format)
  period_year int not null check (period_year >= 2020),
  period_month int not null check (period_month >= 1 and period_month <= 12),
  
  -- Timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  
  -- Ensure one record per user per month
  unique(user_id, period_year, period_month)
);

-- Create indexes for performance
create index if not exists ai_search_usage_user_id_idx on public.ai_search_usage(user_id);
create index if not exists ai_search_usage_period_idx on public.ai_search_usage(period_year, period_month);
create index if not exists ai_search_usage_created_at_idx on public.ai_search_usage(created_at);

-- Trigger to keep updated_at fresh
create or replace function public.set_ai_search_usage_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists ai_search_usage_set_updated_at on public.ai_search_usage;
create trigger ai_search_usage_set_updated_at
before update on public.ai_search_usage
for each row execute function public.set_ai_search_usage_updated_at();

-- Function to increment search count for current month
create or replace function public.increment_ai_search_usage(p_user_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  v_current_year int;
  v_current_month int;
  v_search_count int;
begin
  -- Get current year and month
  v_current_year := extract(year from timezone('utc', now()))::int;
  v_current_month := extract(month from timezone('utc', now()))::int;
  
  -- Insert or update usage record
  insert into public.ai_search_usage (user_id, period_year, period_month, search_count)
  values (p_user_id, v_current_year, v_current_month, 1)
  on conflict (user_id, period_year, period_month)
  do update set
    search_count = ai_search_usage.search_count + 1,
    updated_at = timezone('utc', now())
  returning search_count into v_search_count;
  
  return v_search_count;
end;
$$;

-- Function to get current month's search count
create or replace function public.get_ai_search_usage_count(p_user_id uuid)
returns int
language plpgsql
security definer
stable
as $$
declare
  v_current_year int;
  v_current_month int;
  v_search_count int;
begin
  -- Get current year and month
  v_current_year := extract(year from timezone('utc', now()))::int;
  v_current_month := extract(month from timezone('utc', now()))::int;
  
  -- Get search count for current month
  select coalesce(search_count, 0) into v_search_count
  from public.ai_search_usage
  where user_id = p_user_id
    and period_year = v_current_year
    and period_month = v_current_month;
  
  return coalesce(v_search_count, 0);
end;
$$;

-- Enable RLS
alter table public.ai_search_usage enable row level security;

-- RLS Policies
-- Users can view their own usage
drop policy if exists "Users can view their own AI search usage" on public.ai_search_usage;
create policy "Users can view their own AI search usage"
  on public.ai_search_usage
  for select
  using (auth.uid() = user_id);

-- System can insert/update usage (via server-side actions)
drop policy if exists "System can manage AI search usage" on public.ai_search_usage;
create policy "System can manage AI search usage"
  on public.ai_search_usage
  for all
  using (true)
  with check (true);

-- Add comments for documentation
comment on table public.ai_search_usage is 'Monthly usage tracking for AI searches - used for rate limiting based on subscription tiers';
comment on column public.ai_search_usage.period_year is 'Year of the usage period';
comment on column public.ai_search_usage.period_month is 'Month of the usage period (1-12)';
comment on column public.ai_search_usage.search_count is 'Number of searches performed in this month';





