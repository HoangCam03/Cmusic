import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import permissionRoutes  from './routes/permission.routes';
import planFeatureRoutes from './routes/plan-feature.routes';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PERMISSION_SERVICE_PORT || '3009', 10);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DATABASE =====
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cmusic');
    console.log(' Permission-service: MongoDB kết nối thành công');
  } catch (error) {
    console.error(' Lỗi kết nối MongoDB:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

// ===== HEALTH CHECK =====
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'permission-service', port: PORT });
});

// ===== ROUTES =====
// NOTE: Xác thực JWT + kiểm tra quyền admin được xử lý tại API Gateway.
//       Service này chỉ xử lý business logic thuần túy.
app.use('/permissions',   permissionRoutes);
app.use('/plan-features', planFeatureRoutes);

// 404 fallback
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route không tồn tại' });
});

// ===== BOOT =====
const startServer = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(` Permission Service running at http://localhost:${PORT}`);
    console.log('   Routes:');
    console.log('   GET|POST|PUT|DELETE /permissions');
    console.log('   GET|POST|PUT|DELETE /plan-features');
  });
};

startServer();

export default app;
