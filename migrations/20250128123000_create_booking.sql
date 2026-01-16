CREATE TYPE booking_status AS ENUM(
  'PENDING',
  'CONFIRMED',
  'CANCELLED'
);

CREATE TABLE bookings(
  
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  status booking_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_bookings_user FOREIGN KEY(user_id) REFERENCES users(id)
  ON DELETE CASCADE,
  CONSTRAINT fk_booking_event FOREIGN KEY(event_id) REFERENCES events(id)
  ON DELETE CASCADE

);

CREATE UNIQUE INDEX unique_pending_booking_per_user
ON bookings (user_id)
WHERE status = 'PENDING';