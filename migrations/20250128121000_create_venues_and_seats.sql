CREATE TABLE venues(
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE seats(
  id BIGSERIAL PRIMARY KEY,
  venue_id BIGINT NOT NULL,
  row_number INT NOT NULL,
  seat_number INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_seats_venue FOREIGN KEY(venue_id) REFERENCES venues(id)
  ON DELETE CASCADE,

  CONSTRAINT seat_row_positive CHECK (row_number > 0),
  CONSTRAINT seat_number_positive CHECK (seat_number > 0),

  CONSTRAINT unique_seat_per_venue UNIQUE(venue_id, row_number, seat_number)
);