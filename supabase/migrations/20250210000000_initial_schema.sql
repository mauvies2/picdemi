-- Baseline schema for tables created via Supabase dashboard (not tracked by earlier migrations).
-- This must run before all other migrations.
--
-- Columns added by later ALTER TABLE migrations are NOT included here:
--   events.state              → 20250215000000
--   events.is_public, share_code, price_per_photo → 20250212000005
--   events.watermark_enabled  → 20250212000006
--   events.deleted_at         → 20250220000000
--   events.lat, lng           → 20260324000000
--   events.slug               → 20260326000000
--   photos.state              → 20250215000001

-- ── Events ───────────────────────────────────────────────────────────────────

create table if not exists public.events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  date        date        not null,
  city        text        not null,
  country     text        not null,
  activity    text        not null,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

create or replace function public.set_events_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_events_updated_at();

alter table public.events enable row level security;

-- Photographers manage their own events
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'events_owner_all'
  ) then
    create policy events_owner_all on public.events
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- Talent / public can read public events
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'events_public_select'
  ) then
    create policy events_public_select on public.events
      for select using (true);
  end if;
end $$;

-- ── Photos ────────────────────────────────────────────────────────────────────

create table if not exists public.photos (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  event_id     uuid        references public.events(id) on delete set null,
  original_url text,
  taken_at     timestamptz,
  city         text,
  country      text,
  created_at   timestamptz not null default timezone('utc', now())
);

create index if not exists photos_event_id_idx on public.photos(event_id);
create index if not exists photos_user_id_idx  on public.photos(user_id);

alter table public.photos enable row level security;

-- Photographers manage their own photos
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'photos' and policyname = 'photos_owner_all'
  ) then
    create policy photos_owner_all on public.photos
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- Talent / public can read photos (event-level access controlled at app layer)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'photos' and policyname = 'photos_public_select'
  ) then
    create policy photos_public_select on public.photos
      for select using (true);
  end if;
end $$;
