-- Guest orders: decoupled from auth.users entirely
create table if not exists public.guest_orders (
  id uuid primary key default gen_random_uuid(),
  guest_email text not null,
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  status text not null default 'pending'
    check (status in ('pending','completed','failed','canceled','refunded')),
  total_amount_cents int not null check (total_amount_cents >= 0),
  currency text not null default 'usd',
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.guest_order_items (
  id uuid primary key default gen_random_uuid(),
  guest_order_id uuid not null references public.guest_orders(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete restrict,
  photographer_id uuid not null references auth.users(id) on delete restrict,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity int not null default 1,
  total_price_cents int not null check (total_price_cents >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

-- Stores cart snapshot before Stripe session is created (handles large carts)
create table if not exists public.pending_guest_checkouts (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  cart_items jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '2 hours')
);

create index on public.guest_orders(guest_email);
create index on public.guest_orders(stripe_checkout_session_id);
create index on public.guest_order_items(guest_order_id);
create index on public.guest_order_items(photographer_id);
create index on public.guest_order_items(photo_id);
create index on public.pending_guest_checkouts(stripe_session_id);

-- All access goes through supabaseAdmin — enable RLS with no permissive policies
alter table public.guest_orders enable row level security;
alter table public.guest_order_items enable row level security;
alter table public.pending_guest_checkouts enable row level security;
