import redis from '../redis/client.js';

const LOCK_TTL_SECONDS = 600; // 10 minutes

export async function lockSeats(userId, eventId, seatIds) {
  const lockedKeys = [];

  try {
    for (const seatId of seatIds) {
      const key = `lock:event:${eventId}:seat:${seatId}`;
      const value = `user:${userId}`;

      const result = await redis.set(
        key,
        value,
        'NX',
        'EX',
        LOCK_TTL_SECONDS
      );

      if (result !== 'OK') {
        throw new Error(`SEAT_LOCK_FAILED:${seatId}`);
      }

      lockedKeys.push(key);
    }

    return lockedKeys;
  } catch (err) {
    if (lockedKeys.length > 0) {
      await redis.del(lockedKeys);
    }
    throw err;
  }
}

export async function unlockSeats(lockedKeys) {
  if (!lockedKeys || lockedKeys.length === 0) {
    return;
  }

  await redis.del(lockedKeys);
}
