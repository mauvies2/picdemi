-- Create photo_embeddings table for storing photo embeddings
-- Used for similarity search against selfie embeddings

-- Ensure pgvector extension is enabled
create extension if not exists vector;

-- Create photo_embeddings table
create table if not exists public.photo_embeddings (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  
  -- Photo embedding (vector type from pgvector)
  embedding vector(512), -- TODO: Adjust dimension based on actual embedding model
  
  -- Model metadata
  model_version text not null default 'v1.0',
  
  -- Timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Ensure model_version column exists (in case table was created without it)
-- This must run BEFORE the unique constraint
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'photo_embeddings'
      and column_name = 'model_version'
  ) then
    alter table public.photo_embeddings
      add column model_version text not null default 'v1.0';
  end if;
end
$$;

-- Ensure created_at column exists
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'photo_embeddings'
      and column_name = 'created_at'
  ) then
    alter table public.photo_embeddings
      add column created_at timestamptz not null default timezone('utc', now());
  end if;
end
$$;

-- Ensure updated_at column exists
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'photo_embeddings'
      and column_name = 'updated_at'
  ) then
    alter table public.photo_embeddings
      add column updated_at timestamptz not null default timezone('utc', now());
  end if;
end
$$;

-- Add unique constraint if table exists but constraint doesn't
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'photo_embeddings_photo_id_model_version_key'
  ) then
    alter table public.photo_embeddings
      add constraint photo_embeddings_photo_id_model_version_key
      unique(photo_id, model_version);
  end if;
end
$$;

-- Create indexes for performance
create index if not exists photo_embeddings_photo_id_idx on public.photo_embeddings(photo_id);
create index if not exists photo_embeddings_model_version_idx on public.photo_embeddings(model_version);
create index if not exists photo_embeddings_created_at_idx on public.photo_embeddings(created_at);

-- Create vector index for similarity search (using HNSW for fast approximate nearest neighbor)
-- TODO: Adjust m and ef_construction parameters based on performance testing
create index if not exists photo_embeddings_embedding_idx 
  on public.photo_embeddings 
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Trigger to keep updated_at fresh
create or replace function public.set_photo_embeddings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists photo_embeddings_set_updated_at on public.photo_embeddings;
create trigger photo_embeddings_set_updated_at
before update on public.photo_embeddings
for each row execute function public.set_photo_embeddings_updated_at();

-- Enable RLS
alter table public.photo_embeddings enable row level security;

-- RLS Policies
-- Users can view embeddings for photos they have access to
-- (via events they own or photos they're tagged in)
drop policy if exists "Users can view photo embeddings for accessible photos" on public.photo_embeddings;
create policy "Users can view photo embeddings for accessible photos"
  on public.photo_embeddings
  for select
  using (
    -- Photographers can view embeddings for their own photos
    exists (
      select 1
      from public.photos
      where photos.id = photo_embeddings.photo_id
        and photos.user_id = auth.uid()
    )
    or
    -- Talent can view embeddings for photos they're tagged in
    exists (
      select 1
      from public.talent_photo_tags
      where talent_photo_tags.photo_id = photo_embeddings.photo_id
        and talent_photo_tags.talent_user_id = auth.uid()
    )
    or
    -- Users can view embeddings for public events
    exists (
      select 1
      from public.photos
      join public.events on events.id = photos.event_id
      where photos.id = photo_embeddings.photo_id
        and events.is_public = true
    )
  );

-- System/service role can insert embeddings (via server-side actions)
drop policy if exists "System can insert photo embeddings" on public.photo_embeddings;
create policy "System can insert photo embeddings"
  on public.photo_embeddings
  for insert
  with check (true);

-- System/service role can update embeddings
drop policy if exists "System can update photo embeddings" on public.photo_embeddings;
create policy "System can update photo embeddings"
  on public.photo_embeddings
  for update
  using (true)
  with check (true);

-- Add comments for documentation
comment on table public.photo_embeddings is 'Vector embeddings for photos - used for AI similarity search';
comment on column public.photo_embeddings.embedding is 'Vector embedding of the photo (512 dimensions)';
comment on column public.photo_embeddings.model_version is 'Version of the embedding model used (e.g., v1.0, v2.0)';

