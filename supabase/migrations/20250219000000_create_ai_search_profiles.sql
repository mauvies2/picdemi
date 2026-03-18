-- Create AI Search Profiles table for talent users
-- Stores selfie embeddings and search preferences for AI matching

-- Enable pgvector extension if not already enabled
create extension if not exists vector;

-- Create ai_search_profiles table
create table if not exists public.ai_search_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  
  -- Selfie embedding (vector type from pgvector)
  selfie_embedding vector(512), -- TODO: Adjust dimension based on actual embedding model
  
  -- Search filters/preferences
  activity_type text, -- e.g., 'SURF', 'MTB', 'RUNNING_ROAD', etc.
  country text,
  region text, -- state/province/region
  date_from date,
  date_to date,
  
  -- Timestamps
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Create indexes for performance
create index if not exists ai_search_profiles_user_id_idx on public.ai_search_profiles(user_id);
create index if not exists ai_search_profiles_activity_type_idx on public.ai_search_profiles(activity_type);
create index if not exists ai_search_profiles_country_idx on public.ai_search_profiles(country);
create index if not exists ai_search_profiles_created_at_idx on public.ai_search_profiles(created_at);

-- Create vector index for similarity search (using HNSW for fast approximate nearest neighbor)
-- TODO: Adjust m and ef_construction parameters based on performance testing
create index if not exists ai_search_profiles_embedding_idx 
  on public.ai_search_profiles 
  using hnsw (selfie_embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Trigger to keep updated_at fresh
create or replace function public.set_ai_search_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists ai_search_profiles_set_updated_at on public.ai_search_profiles;
create trigger ai_search_profiles_set_updated_at
before update on public.ai_search_profiles
for each row execute function public.set_ai_search_profiles_updated_at();

-- Enable RLS
alter table public.ai_search_profiles enable row level security;

-- RLS Policies
-- Users can view their own profiles
drop policy if exists "Users can view their own AI search profiles" on public.ai_search_profiles;
create policy "Users can view their own AI search profiles"
  on public.ai_search_profiles
  for select
  using (auth.uid() = user_id);

-- Users can insert their own profiles
drop policy if exists "Users can create their own AI search profiles" on public.ai_search_profiles;
create policy "Users can create their own AI search profiles"
  on public.ai_search_profiles
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own profiles
drop policy if exists "Users can update their own AI search profiles" on public.ai_search_profiles;
create policy "Users can update their own AI search profiles"
  on public.ai_search_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own profiles
drop policy if exists "Users can delete their own AI search profiles" on public.ai_search_profiles;
create policy "Users can delete their own AI search profiles"
  on public.ai_search_profiles
  for delete
  using (auth.uid() = user_id);

-- Add comments for documentation
comment on table public.ai_search_profiles is 'AI search profiles for talent users - stores selfie embeddings and search preferences';
comment on column public.ai_search_profiles.selfie_embedding is 'Vector embedding of the selfie image (512 dimensions)';
comment on column public.ai_search_profiles.activity_type is 'Preferred activity type filter (e.g., SURF, MTB, RUNNING_ROAD)';
comment on column public.ai_search_profiles.country is 'Country filter for search';
comment on column public.ai_search_profiles.region is 'State/province/region filter for search';





