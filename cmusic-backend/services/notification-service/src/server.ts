import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose, { Schema } from 'mongoose';
import notificationRoutes from './routes/notification.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// ===== ĐỊNH NGHĨA MODEL CỤC BỘ - Dùng mongoose instance của chính service này =====
// Không import từ @spotify/libs/database vì nó dùng mongoose instance khác
const NotificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['FOLLOW', 'COMMENT_TAG', 'REPLY', 'NEW_RELEASE', 'SYSTEM'],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Đăng ký model (kiểm tra tránh duplicate khi hot reload)
export const NotificationModel = mongoose.models['Notification']
  ? mongoose.model('Notification')
  : mongoose.model('Notification', NotificationSchema);

// ===== KẾT NỐI DATABASE =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmusic';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB (Notification Service)');
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===== SOCKET.IO =====
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;

  if (userId) {
    socket.join(userId);
    console.log(`[Socket] User ${userId} connected`);
  }

  socket.on('disconnect', () => {
    console.log('[Socket] User disconnected');
  });
});

// Middleware inject io vào request để controller có thể dùng
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 3010;
httpServer.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
});
