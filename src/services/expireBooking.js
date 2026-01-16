import pool from '../db/pool.js';

export async function expireBookings() {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      UPDATE bookings
      SET status = 'CANCELLED'
      WHERE status = 'PENDING'
        AND created_at < NOW() - INTERVAL '10 minutes'
      `
    );

    console.log(`Expired ${result.rowCount} bookings`);
    return result.rowCount;
  } catch (err) {
    console.error('Expire bookings failed:', err);
    throw err;
  } finally {
    client.release();
  }
}
