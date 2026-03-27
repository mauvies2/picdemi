-- Make location (city) required on events.
-- Update any existing rows that have an empty city before adding the constraint.
UPDATE events SET city = 'Unknown' WHERE city = '' OR city IS NULL;

ALTER TABLE events
  ADD CONSTRAINT events_city_not_empty CHECK (city <> '');
