-- Create payouts table for tracking photographer payout requests
-- Manual payout system (Option A) - admin processes payouts manually

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references auth.users(id) on delete cascade,
  
  -- Payout details
  amount_cents int not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  
  -- Admin notes (optional)
  admin_notes text,
  
  -- Timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  paid_at timestamptz
);

-- Create indexes for performance
create index if not exists payouts_photographer_id_idx on public.payouts(photographer_id);
create index if not exists payouts_status_idx on public.payouts(status);
create index if not exists payouts_created_at_idx on public.payouts(created_at);

-- Trigger to keep updated_at fresh
create or replace function public.set_payouts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists payouts_set_updated_at on public.payouts;
create trigger payouts_set_updated_at
before update on public.payouts
for each row execute function public.set_payouts_updated_at();

-- Trigger to set paid_at when status changes to 'paid'
create or replace function public.set_payouts_paid_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'paid' and old.status != 'paid' then
    new.paid_at = timezone('utc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists payouts_set_paid_at on public.payouts;
create trigger payouts_set_paid_at
before update on public.payouts
for each row execute function public.set_payouts_paid_at();

-- Enable RLS
alter table public.payouts enable row level security;

-- RLS Policies for payouts
-- Photographers can view their own payouts
drop policy if exists "Photographers can view their own payouts" on public.payouts;
create policy "Photographers can view their own payouts"
  on public.payouts
  for select
  using (auth.uid() = photographer_id);

-- Photographers can create their own payout requests
drop policy if exists "Photographers can create their own payouts" on public.payouts;
create policy "Photographers can create their own payouts"
  on public.payouts
  for insert
  with check (auth.uid() = photographer_id);

-- System can update payouts (via admin actions/server actions)
-- Note: In production, you might want to restrict this to admin users only
drop policy if exists "System can update payouts" on public.payouts;
create policy "System can update payouts"
  on public.payouts
  for update
  using (true)
  with check (true);

-- Add comments for documentation
comment on table public.payouts is 'Photographer payout requests - manual processing system';
comment on column public.payouts.amount_cents is 'Payout amount in cents';
comment on column public.payouts.status is 'Payout status: pending, approved, paid, cancelled';
comment on column public.payouts.admin_notes is 'Optional admin notes for payout processing';

