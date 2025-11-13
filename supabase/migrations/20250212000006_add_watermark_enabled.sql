-- Add watermark_enabled column to events table
alter table public.events
  add column if not exists watermark_enabled boolean not null default true;

-- Set watermark_enabled to true for all existing public events
update public.events
set watermark_enabled = true
where is_public = true and watermark_enabled is null;

-- Add comment for documentation
comment on column public.events.watermark_enabled is 'Whether to show watermark on photos for talent users (only applies to public events)';

