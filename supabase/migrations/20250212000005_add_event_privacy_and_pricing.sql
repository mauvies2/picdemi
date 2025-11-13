-- Add privacy and pricing columns to events table
alter table public.events
  add column if not exists is_public boolean not null default true,
  add column if not exists share_code text,
  add column if not exists price_per_photo numeric(10, 2);

-- Create unique index on share_code for fast lookups
create unique index if not exists events_share_code_idx on public.events(share_code)
where share_code is not null;

-- Add comment for documentation
comment on column public.events.is_public is 'Whether the event is publicly accessible or requires a share code';
comment on column public.events.share_code is 'Unique code for accessing private events';
comment on column public.events.price_per_photo is 'Price per photo in the event (nullable, can be free)';

