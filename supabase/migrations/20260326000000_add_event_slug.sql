-- Add SEO-friendly slug column to events
-- Slugs are nullable so existing rows are not immediately broken.
-- New events populate the slug via the application layer (actions.ts).
-- The unique index uses a partial index (WHERE slug IS NOT NULL) so that
-- multiple NULL values are allowed (standard SQL NULL != NULL behavior).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS events_slug_idx
  ON public.events (slug)
  WHERE slug IS NOT NULL;

-- Backfill slugs for existing events using PostgreSQL string functions.
-- The formula mirrors generateEventSlug() in lib/slugify.ts:
--   lower(name) + '-' + lower(city) + '-' + year + '-' + first-6-chars-of-id
-- The unaccent extension is available on all Supabase projects.
CREATE EXTENSION IF NOT EXISTS unaccent;

UPDATE public.events
SET slug = regexp_replace(
  lower(
    unaccent(name)  || '-' ||
    unaccent(city)  || '-' ||
    EXTRACT(YEAR FROM date::date)::text || '-' ||
    left(id::text, 6)
  ),
  '[^a-z0-9]+',   -- remove anything that is not lowercase alphanum
  '-',
  'g'
)
WHERE slug IS NULL
  AND deleted_at IS NULL;
