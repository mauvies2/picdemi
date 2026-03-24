-- Add nullable lat/lng columns to events for radius-based search
ALTER TABLE events ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE events ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Index for bounding-box queries on public, non-deleted events
CREATE INDEX IF NOT EXISTS idx_events_lat_lng
  ON events (lat, lng)
  WHERE deleted_at IS NULL AND is_public = true;
