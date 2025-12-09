-- Add soft delete support to events table
-- This allows preserving historical data and metrics even after events are "deleted"

alter table public.events
  add column if not exists deleted_at timestamptz;

-- Create index for filtering non-deleted events
create index if not exists events_deleted_at_idx on public.events(deleted_at)
where deleted_at is null;

-- Add comment for documentation
comment on column public.events.deleted_at is 'Timestamp when the event was soft-deleted. NULL means the event is active.';

