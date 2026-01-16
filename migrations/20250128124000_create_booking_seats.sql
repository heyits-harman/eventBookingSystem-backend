CREATE TABLE booking_seats(
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  seat_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_booking_seats_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
  ON DELETE CASCADE,
  CONSTRAINT fk_booking_seats_seats FOREIGN KEY (seat_id) REFERENCES seats(id)
  ON DELETE CASCADE,
  CONSTRAINT fk_booking_seats_events FOREIGN KEY (event_id) REFERENCES events(id)
  ON DELETE CASCADE
);

CREATE UNIQUE INDEX unique_confirmed_seat_per_event
ON booking_seats (event_id, seat_id);
