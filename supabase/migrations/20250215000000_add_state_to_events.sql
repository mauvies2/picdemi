-- Add state/province column to events table
alter table public.events
  add column if not exists state text not null default '';

-- Update existing rows to have an empty string for state
update public.events
set state = ''
where state is null;

-- Make state NOT NULL
alter table public.events
  alter column state set not null,
  alter column state drop default;

-- Add comment for documentation
comment on column public.events.state is 'State or province within the country (required)';

