-- Create talent_photo_tags table for tagging talent users on photos
-- This enables photographers to tag talent on their photos

create table if not exists public.talent_photo_tags (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  talent_user_id uuid not null references auth.users(id) on delete cascade,
  tagged_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  
  -- Prevent duplicate tags
  unique(photo_id, talent_user_id)
);

-- Indexes for efficient queries
create index if not exists talent_photo_tags_photo_id_idx on public.talent_photo_tags(photo_id);
create index if not exists talent_photo_tags_talent_user_id_idx on public.talent_photo_tags(talent_user_id);
create index if not exists talent_photo_tags_tagged_by_user_id_idx on public.talent_photo_tags(tagged_by_user_id);
create index if not exists talent_photo_tags_created_at_idx on public.talent_photo_tags(created_at desc);

-- RLS Policies
alter table public.talent_photo_tags enable row level security;

-- Photographers can tag talent on their own photos
create policy "Photographers can tag talent on their photos"
  on public.talent_photo_tags
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.photos
      where photos.id = talent_photo_tags.photo_id
        and photos.user_id = auth.uid()
    )
  );

-- Photographers can untag talent from their own photos
create policy "Photographers can untag talent from their photos"
  on public.talent_photo_tags
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.photos
      where photos.id = talent_photo_tags.photo_id
        and photos.user_id = auth.uid()
    )
  );

-- Talent can view tags on photos where they are tagged
create policy "Talent can view their own tags"
  on public.talent_photo_tags
  for select
  to authenticated
  using (talent_user_id = auth.uid());

-- Photographers can view tags on their own photos
create policy "Photographers can view tags on their photos"
  on public.talent_photo_tags
  for select
  to authenticated
  using (
    exists (
      select 1 from public.photos
      where photos.id = talent_photo_tags.photo_id
        and photos.user_id = auth.uid()
    )
  );

