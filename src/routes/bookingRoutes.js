import express from 'express';
import { createBooking, confirmBooking, cancelBooking } from '../services/booking.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try{
    const { userId, eventId, seatIds } = req.body;
    const bookingId = await createBooking(userId, eventId, seatIds);

    res.status(200).json({
      bookingId: bookingId,
      status: "PENDING"
    });
  } catch(err){
    res.status(400).json({error: err.message});
  }
});

router.post('/:id/confirm', async (req, res) => {
  try{
    const bookingId = Number(req.params.id);
    const { userId } = req.body;

    await confirmBooking(userId, bookingId);

    res.status(200).json({
      bookingId,
      status: "CONFIRMED"
    });
  } catch(err){
    res.status(400).json({error: err.message});
  }
});

router.post('/:id/cancel', async (req, res) => {
  try{

    const bookingId = Number(req.params.id);
    const { userId } = req.body;

    await cancelBooking(userId, bookingId);

    res.status(200).json({
      bookingId,
      status: "CANCELLED"
    });
  } catch(err){
    res.status(400).json({error: err.message});
  }
})

export default router;