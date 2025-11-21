-- Create subscriptions table for Stripe subscription management
-- Each user can have only one active subscription

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  plan_id text not null check (plan_id in ('free', 'amateur', 'pro')),
  status text not null check (status in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  current_period_end timestamptz,
  
  -- Timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Create indexes for performance
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions(stripe_subscription_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

-- Trigger to keep updated_at current
create or replace function public.set_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_subscriptions_updated_at();

-- Add comment for documentation
comment on table public.subscriptions is 'Stripe subscription management - one subscription per user';
comment on column public.subscriptions.user_id is 'Unique user ID - each user can have only one subscription';
comment on column public.subscriptions.stripe_customer_id is 'Stripe customer ID';
comment on column public.subscriptions.stripe_subscription_id is 'Stripe subscription ID (nullable for incomplete subscriptions)';
comment on column public.subscriptions.plan_id is 'Current plan: free, amateur, or pro';
comment on column public.subscriptions.status is 'Stripe subscription status';

