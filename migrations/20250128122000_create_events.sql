CREATE TABLE events(
  id BIGSERIAL PRIMARY KEY,
  venue_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_events_venue FOREIGN KEY(venue_id) REFERENCES venues(id)
  ON DELETE CASCADE
);

CREATE INDEX idx_events_venue_starts_at 
ON events (venue_id, starts_at);