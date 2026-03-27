-- ─── Time Sync & Photo Filtering ─────────────────────────────────────────────

-- Events: add time sync fields
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS time_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_offset BIGINT; -- null = sync pending; value in milliseconds

-- Photos: ensure taken_at is TIMESTAMPTZ (may already be if a prior migration ran).
-- Only convert if the column is still TEXT; skip otherwise.
DO $$
BEGIN
  IF (
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'photos'
      AND column_name  = 'taken_at'
  ) = 'text' THEN
    EXECUTE $q$
      ALTER TABLE photos
        ALTER COLUMN taken_at TYPE TIMESTAMPTZ USING
          NULLIF(TRIM(taken_at), '')::TIMESTAMPTZ
    $q$;
  END IF;
END $$;

ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS corrected_taken_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_photos_corrected_taken_at
  ON photos(corrected_taken_at);

-- ─── Time Sync Tokens ─────────────────────────────────────────────────────────
-- Each token encodes a server timestamp so the photographer can photograph
-- the QR code and we can resolve the camera-to-server time offset.

CREATE TABLE IF NOT EXISTS time_sync_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  server_time TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_sync_tokens_event_id
  ON time_sync_tokens(event_id);

-- RLS: only the event owner can read/write tokens for their events
ALTER TABLE time_sync_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographer can manage own time sync tokens"
  ON time_sync_tokens
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );
