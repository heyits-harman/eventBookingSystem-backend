import express from 'express';
import './env.js';
import bookingRoutes from './routes/bookingRoutes.js';

const app = express();
app.use(express.json());

app.use('/bookings', bookingRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});