import pool from '../db/pool.js';
import { lockSeats, unlockSeats } from './seatLock.js';
import redis from '../redis/client.js';

export async function createBooking(userId, eventId, seatIds){
  
  if(!userId || !eventId  || !Array.isArray(seatIds)){
    throw new Error('INVALID_INPUT!');
  }
  if(seatIds.length < 1 || seatIds.length > 6){
    throw new Error('INVALID_SEAT_COUNT!');
  }

  const uniqueSeats = new Set(seatIds);
  if(uniqueSeats.size !== seatIds.length){
    throw new Error('DUPLICATE_SEATS!');
  }

  let lockedKeys;
  try{

    lockedKeys = await lockSeats(userId, eventId, seatIds);
    const client = await pool.connect();
    
    try{

      await client.query("BEGIN");                          //Transaction Beginnig

        const pendingCheck = await client.query(          //Checking pending bookings per user
          `SELECT 1 FROM bookings                        
          WHERE user_id = $1 AND status = 'PENDING'
          LIMIT 1`,
          [userId]
        );
        if(pendingCheck.rowCount > 0){
          throw new Error("USER_ALREADY_HAS_PENDING_BOOKING"); //Restricting users with already pending bookings
        }

        const bookingResult = await client.query(            //Inserting into booking table
          `INSERT INTO bookings(user_id, event_id, status)
          VALUES ($1, $2, 'PENDING')
          RETURNING id`,
          [userId, eventId]
        );
        const bookingId = bookingResult.rows[0].id;         //Storing booking id separatly

      await client.query("COMMIT");                        //Transaction Ending

      const seatKey = `booking:${bookingId}:seats`;
        await redis.set(
          seatKey,
          JSON.stringify(seatIds),
          'EX',
          600,
        );
      return bookingId;

    } catch(dbErr){
      await client.query("ROLLBACK");
      throw dbErr;

    } finally {
      client.release();
    }

  } catch(err){
      if(lockedKeys){
        await unlockSeats(lockedKeys);
      }
    throw err;
  }
}

export async function confirmBooking(userId, bookingId){

  if(!userId || !bookingId){
    throw new Error("INVALID_INPUT");
  }
  
  const client = await pool.connect();
  let lockedKeys = [];
  
  try{

    await client.query("BEGIN");

      const bookingResult = await client.query(          //Selecting booking with similar booking id
        `SELECT id, user_id, event_id, status, created_at
         FROM bookings
         WHERE id = $1
         FOR UPDATE`,
         [bookingId]
      );
      if(bookingResult.rowCount === 0){                //Checking if booking exists
        throw new Error("BOOKING_NOT_FOUND");
      }

      const booking = bookingResult.rows[0];            //Storing booking row 
      const dbBookingId = booking.id;

      const ownerId = Number(booking.user_id);
      if(ownerId !== userId){
        throw new Error("UNAUTHORIZED_BOOKING_ACCESS");         //Validating user id
      }
      if(booking.status !== "PENDING"){                          //Validating booking status
        throw new Error("BOOKING_NOT_PENDING");
      }

      const seatKey = `booking:${bookingId}:seats`;                             
      const seatData = await redis.get(seatKey);                                 //Reading seat intent from redis

      if(!seatData){
        throw new Error("SEAT_INTENT_EXPIRED");                                  //Existence check
      }

      const seatIds = JSON.parse(seatData);

      if(!Array.isArray(seatIds) || seatIds.length === 0 || seatIds.length > 6){                        //Validation check
        throw new Error("INVALID_SEAT_INTENT")
      }

      for(const seatId of seatIds){
        const lockKey = `lock:event:${booking.event_id}:seat:${seatId}`;              
        const owner = await redis.get(lockKey);

        if(owner !== `user:${userId}`){                                         //Validate locks
          throw new Error(`SEAT_LOCK_INVALID:${seatId}`);
        }
        lockedKeys.push(lockKey);                                                    //Pushing individual seats
      }

      for(const seatId of seatIds){                                             //Inserting confirmed seats
        await client.query(                                   
          `INSERT INTO booking_seats (booking_id, event_id, seat_id)
           VALUES ($1, $2, $3)`,
           [bookingId, booking.event_id, seatId]
        );
      }

      await client.query(                                                    //Updating booking status
        `UPDATE bookings
         SET status = 'CONFIRMED'
         WHERE id = $1`,
         [bookingId]
      );

    await client.query("COMMIT");

    await unlockSeats(lockedKeys);                                       //Unlocking seats
    await redis.del(seatKey);                                            //Cleanup redis

    return dbBookingId;
    
  } catch(dbErr){
     await client.query("ROLLBACK");
    throw dbErr;
  } finally{
      client.release();
  }

}

export async function cancelBooking(userId, bookingId){
  
  if(!userId || !bookingId){
    throw new Error("INVALID_INPUT");                               //Parameter validation
  }

  const client = await pool.connect();
  let lockedKeys = [];

  try{

    await client.query("BEGIN");

    const result = await client.query(                                  //Locking booking row
      `SELECT id, user_id, event_id, status
       FROM bookings
       WHERE id = $1
       FOR UPDATE`,
       [bookingId]
    );

    if(result.rowCount === 0){
      throw new Error("BOOKING_DOES_NOT_EXISTS");
    }
    const booking = result.rows[0];

    const ownerId = Number(booking.user_id);
    if(ownerId !== userId){                                     //User validation
      throw new Error("INVALID_USER_ID");
    }
    if(booking.status !== 'PENDING'){
      throw new Error("BOOOKING_IS_NOT_PENDING");                          //Status validation
    }

    await client.query(                                               //Updating status in bookings table
      `UPDATE bookings
       SET status = 'CANCELLED'
       WHERE user_id = $1`,
       [userId]
    );

    await client.query("COMMIT");

    const seatKey = `booking:${bookingId}:seats`;                                 
    const seatData = await redis.get(seatKey);                                //Reading redis intent

    if(seatData){
      const seatIds = JSON.parse(seatData);                                      //Parsing seats

      if(Array.isArray(seatIds)){
        for(const seatId of seatIds){
          lockedKeys.push(`lock:event:${booking.event_id}:seat:${seatId}`);                 //Pushing individual seats
        }
      }
    }

    await unlockSeats(lockedKeys);                                               //Removing redis lock
    await redis.del(seatKey);                                            //Deleting redis intent

  } catch(err){
     await client.query("ROLLBACK");
    throw err;
  } finally{
    client.release();
  }

};