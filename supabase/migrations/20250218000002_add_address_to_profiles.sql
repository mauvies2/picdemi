-- Add payout profile fields to profiles table
-- Required for tax compliance and payment processing
-- These fields are collected after signup, gating payout requests

alter table public.profiles
  add column if not exists full_name text, -- Legal full name for payouts
  add column if not exists country_code text, -- ISO 3166-1 alpha-2 country code
  add column if not exists city text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists state_or_region text, -- Optional, country-dependent
  add column if not exists postal_code text,
  add column if not exists payout_method text check (payout_method in ('bank_transfer', 'paypal', 'other') or payout_method is null),
  add column if not exists payout_details_json jsonb default '{}'::jsonb, -- Flexible JSON for payout details (IBAN, PayPal email, etc.)
  add column if not exists is_payout_profile_complete boolean not null default false; -- Gates payout requests

-- Create indexes for country lookups
create index if not exists profiles_country_code_idx on public.profiles(country_code);
create index if not exists profiles_payout_complete_idx on public.profiles(is_payout_profile_complete);

-- Add comments
comment on column public.profiles.full_name is 'Legal full name for payouts and tax reporting';
comment on column public.profiles.country_code is 'ISO 3166-1 alpha-2 country code (e.g., US, GB, ES)';
comment on column public.profiles.payout_method is 'Preferred payout method: bank_transfer, paypal, or other';
comment on column public.profiles.payout_details_json is 'Flexible JSON for payout details (IBAN, PayPal email, account numbers, etc.)';
comment on column public.profiles.is_payout_profile_complete is 'Whether payout profile is complete - gates payout requests';

