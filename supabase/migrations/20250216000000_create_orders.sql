-- Create orders table for tracking completed purchases
-- This table will integrate with Stripe for payment processing

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cart_id uuid references public.carts(id) on delete set null,
  
  -- Stripe integration fields
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  stripe_checkout_session_id text unique,
  
  -- Order details
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'canceled', 'refunded')),
  total_amount_cents int not null check (total_amount_cents >= 0),
  currency text not null default 'usd',
  
  -- Timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  
  -- Metadata (for storing additional Stripe/webhook data as JSON)
  metadata jsonb default '{}'::jsonb
);

-- Create order_items table to track individual photos purchased
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete restrict,
  photographer_id uuid not null references auth.users(id) on delete restrict,
  
  -- Pricing (snapshot at time of purchase)
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity int not null default 1 check (quantity > 0),
  total_price_cents int not null check (total_price_cents >= 0),
  
  -- Timestamps
  created_at timestamptz not null default timezone('utc', now())
);

-- Create indexes for performance
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_cart_id_idx on public.orders(cart_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_stripe_payment_intent_id_idx on public.orders(stripe_payment_intent_id);
create index if not exists orders_stripe_checkout_session_id_idx on public.orders(stripe_checkout_session_id);
create index if not exists orders_created_at_idx on public.orders(created_at);

create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_photo_id_idx on public.order_items(photo_id);
create index if not exists order_items_photographer_id_idx on public.order_items(photographer_id);

-- Trigger to keep updated_at fresh
create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_orders_updated_at();

-- Trigger to set completed_at when status changes to 'completed'
create or replace function public.set_orders_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    new.completed_at = timezone('utc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_set_completed_at on public.orders;
create trigger orders_set_completed_at
before update on public.orders
for each row execute function public.set_orders_completed_at();

-- Helper function to check if photographer has items in an order
-- Uses SECURITY DEFINER to avoid RLS recursion issues
create or replace function public.order_has_photographer_items(order_id uuid, photographer_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (
    select 1
    from public.order_items
    where order_items.order_id = order_has_photographer_items.order_id
      and order_items.photographer_id = order_has_photographer_items.photographer_id
  );
end;
$$;

-- Enable RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- RLS Policies for orders
-- Users can view their own orders
drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
  on public.orders
  for select
  using (auth.uid() = user_id);

-- Photographers can view orders for their photos
-- Uses SECURITY DEFINER function to avoid RLS recursion
drop policy if exists "Photographers can view orders for their photos" on public.orders;
create policy "Photographers can view orders for their photos"
  on public.orders
  for select
  using (public.order_has_photographer_items(orders.id, auth.uid()));

-- Users can create their own orders (via server-side actions)
drop policy if exists "Users can create their own orders" on public.orders;
create policy "Users can create their own orders"
  on public.orders
  for insert
  with check (auth.uid() = user_id);

-- System can update orders (via webhooks/server actions)
-- Note: In production, you might want to restrict this further
drop policy if exists "System can update orders" on public.orders;
create policy "System can update orders"
  on public.orders
  for update
  using (true)
  with check (true);

-- RLS Policies for order_items
-- Users can view order items from their own orders
drop policy if exists "Users can view items from their own orders" on public.order_items;
create policy "Users can view items from their own orders"
  on public.order_items
  for select
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- Photographers can view order items for their photos
drop policy if exists "Photographers can view order items for their photos" on public.order_items;
create policy "Photographers can view order items for their photos"
  on public.order_items
  for select
  using (photographer_id = auth.uid());

-- System can insert order items (via server-side actions)
drop policy if exists "System can insert order items" on public.order_items;
create policy "System can insert order items"
  on public.order_items
  for insert
  with check (true);

-- Add comments for documentation
comment on table public.orders is 'Completed purchases/orders, integrated with Stripe';
comment on table public.order_items is 'Individual photos purchased in an order';
comment on column public.orders.stripe_payment_intent_id is 'Stripe PaymentIntent ID for tracking payment';
comment on column public.orders.stripe_customer_id is 'Stripe Customer ID';
comment on column public.orders.stripe_checkout_session_id is 'Stripe Checkout Session ID';
comment on column public.orders.status is 'Order status: pending, processing, completed, failed, canceled, refunded';
comment on column public.orders.total_amount_cents is 'Total order amount in cents';
comment on column public.order_items.unit_price_cents is 'Price per photo at time of purchase (snapshot)';
comment on column public.order_items.total_price_cents is 'Total price for this line item (unit_price * quantity)';

