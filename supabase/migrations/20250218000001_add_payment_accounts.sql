-- Create payment_accounts table for storing photographer payment methods
-- Supports multiple payment methods: bank account, PayPal, Wise, etc.

create table if not exists public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references auth.users(id) on delete cascade,
  
  -- Payment method type
  type text not null check (type in ('bank_account', 'paypal', 'wise', 'other')),
  
  -- Account details (encrypted/sensitive data)
  -- For bank accounts: account holder name, account number, routing/sort code, bank name, country
  -- For PayPal: PayPal email
  -- For Wise: Wise email or account details
  account_holder_name text,
  country_code text, -- ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'ES')
  account_details jsonb default '{}'::jsonb, -- Flexible JSON for different payment types
  
  -- Display name for the account (e.g., "My Business Bank Account")
  display_name text not null,
  
  -- Whether this is the default account for payouts
  is_default boolean not null default false,
  
  -- Whether account is verified/active
  is_verified boolean not null default false,
  
  -- Timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Create indexes for performance
create index if not exists payment_accounts_photographer_id_idx on public.payment_accounts(photographer_id);
create index if not exists payment_accounts_is_default_idx on public.payment_accounts(photographer_id, is_default) where is_default = true;

-- Ensure only one default account per photographer
create unique index if not exists payment_accounts_one_default_per_photographer 
  on public.payment_accounts(photographer_id) 
  where is_default = true;

-- Trigger to keep updated_at fresh
create or replace function public.set_payment_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists payment_accounts_set_updated_at on public.payment_accounts;
create trigger payment_accounts_set_updated_at
before update on public.payment_accounts
for each row execute function public.set_payment_accounts_updated_at();

-- Enable RLS
alter table public.payment_accounts enable row level security;

-- RLS Policies for payment_accounts
-- Photographers can view their own payment accounts
drop policy if exists "Photographers can view their own payment accounts" on public.payment_accounts;
create policy "Photographers can view their own payment accounts"
  on public.payment_accounts
  for select
  using (auth.uid() = photographer_id);

-- Photographers can create their own payment accounts
drop policy if exists "Photographers can create their own payment accounts" on public.payment_accounts;
create policy "Photographers can create their own payment accounts"
  on public.payment_accounts
  for insert
  with check (auth.uid() = photographer_id);

-- Photographers can update their own payment accounts
drop policy if exists "Photographers can update their own payment accounts" on public.payment_accounts;
create policy "Photographers can update their own payment accounts"
  on public.payment_accounts
  for update
  using (auth.uid() = photographer_id)
  with check (auth.uid() = photographer_id);

-- Photographers can delete their own payment accounts
drop policy if exists "Photographers can delete their own payment accounts" on public.payment_accounts;
create policy "Photographers can delete their own payment accounts"
  on public.payment_accounts
  for delete
  using (auth.uid() = photographer_id);

-- Add payment_account_id to payouts table
alter table public.payouts 
  add column if not exists payment_account_id uuid references public.payment_accounts(id) on delete set null;

create index if not exists payouts_payment_account_id_idx on public.payouts(payment_account_id);

-- Add comments for documentation
comment on table public.payment_accounts is 'Photographer payment accounts for receiving payouts';
comment on column public.payment_accounts.type is 'Payment method type: bank_account, paypal, wise, other';
comment on column public.payment_accounts.account_details is 'JSON object containing payment-specific details (account numbers, emails, etc.)';
comment on column public.payment_accounts.display_name is 'User-friendly name for this payment account';
comment on column public.payouts.payment_account_id is 'Payment account to use for this payout';

