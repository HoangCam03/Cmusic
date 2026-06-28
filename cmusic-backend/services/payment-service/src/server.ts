import express from 'express';
import cors from 'cors';
import { mongoose } from '@spotify/libs/database';
import { PAYMENT_CONFIG } from './config';
import paymentRoutes from './routes/payment.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', paymentRoutes);

// Database connection
mongoose.connect(PAYMENT_CONFIG.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB (Payment Service)');
    app.listen(PAYMENT_CONFIG.PORT, () => {
      console.log(`🚀 Payment Service running on port ${PAYMENT_CONFIG.PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
