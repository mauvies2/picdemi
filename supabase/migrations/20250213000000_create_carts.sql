-- Create carts table
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Create cart_items table
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  photographer_id uuid not null references auth.users(id) on delete cascade,
  unit_price_cents int not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique(cart_id, photo_id)
);

-- Create indexes for performance
create index if not exists carts_user_id_idx on public.carts(user_id);
create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);
create index if not exists cart_items_photo_id_idx on public.cart_items(photo_id);
create index if not exists cart_items_photographer_id_idx on public.cart_items(photographer_id);

-- Trigger to keep updated_at fresh
create or replace function public.set_carts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_carts_updated_at();

-- Enable RLS
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- RLS Policies for carts
-- Users can only see their own carts
create policy "Users can view their own carts"
  on public.carts
  for select
  using (auth.uid() = user_id);

-- Users can insert their own carts
create policy "Users can create their own carts"
  on public.carts
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own carts
create policy "Users can update their own carts"
  on public.carts
  for update
  using (auth.uid() = user_id);

-- Users can delete their own carts
create policy "Users can delete their own carts"
  on public.carts
  for delete
  using (auth.uid() = user_id);

-- RLS Policies for cart_items
-- Users can view cart items from their own carts
create policy "Users can view their own cart items"
  on public.cart_items
  for select
  using (
    exists (
      select 1
      from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

-- Users can insert cart items into their own carts
create policy "Users can add items to their own carts"
  on public.cart_items
  for insert
  with check (
    exists (
      select 1
      from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

-- Users can update cart items in their own carts
create policy "Users can update their own cart items"
  on public.cart_items
  for update
  using (
    exists (
      select 1
      from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

-- Users can delete cart items from their own carts
create policy "Users can delete their own cart items"
  on public.cart_items
  for delete
  using (
    exists (
      select 1
      from public.carts
      where carts.id = cart_items.cart_id
        and carts.user_id = auth.uid()
    )
  );

-- Add comments for documentation
comment on table public.carts is 'Shopping carts for talent users';
comment on table public.cart_items is 'Items in shopping carts';
comment on column public.cart_items.unit_price_cents is 'Price per photo in cents (to avoid floating point issues)';

