create table if not exists public.download_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  -- Either a guest_order_id OR a regular order_id (exactly one must be set)
  guest_order_id uuid references public.guest_orders(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  -- Set when a user creates an account and claims this token
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '30 days'),
  created_at timestamptz not null default timezone('utc', now()),
  constraint exactly_one_order check (
    (guest_order_id is not null)::int + (order_id is not null)::int = 1
  )
);

create index on public.download_tokens(token);
create index on public.download_tokens(guest_order_id);
create index on public.download_tokens(order_id);
create index on public.download_tokens(claimed_by_user_id);

alter table public.download_tokens enable row level security;

-- Authenticated users can view their own claimed tokens
create policy "Users can view their claimed tokens"
  on public.download_tokens for select
  using (claimed_by_user_id = auth.uid());
