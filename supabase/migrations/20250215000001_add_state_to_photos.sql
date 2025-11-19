-- Add state/province column to photos table
alter table public.photos
  add column if not exists state text;

-- Add comment for documentation
comment on column public.photos.state is 'State or province within the country (optional, inherited from event)';

