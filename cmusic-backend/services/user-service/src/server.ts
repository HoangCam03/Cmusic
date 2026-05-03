import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { mongoose } from "@spotify/libs/database";
import { errorMiddleware } from "@spotify/libs/middleware/error.middleware";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.USER_SERVICE_PORT || "3002", 10);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DATABASE CONNECTION =====
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/spotify");
    console.log(" MongoDB kết nối thành công (user-service)");
  } catch (error) {
    console.error(" Lỗi kết nối MongoDB:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

// ===== ROUTES =====

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", service: "user-service", timestamp: new Date().toISOString() });
});

// User routes (prefix: /users)
// Mount cả hai dạng để tương thích với Express 5 strict routing
// Gateway có thể gửi /users hoặc /users/ tùy pathRewrite
app.use("/users", userRoutes);
app.use("/users/", userRoutes);

// ===== 404 Handler (JSON - không dùng HTML mặc định của Express) =====
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found on user-service`,
  });
});

// ===== ERROR HANDLER =====
app.use(errorMiddleware);


// ===== START SERVER =====
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(` User Service đang chạy tại http://localhost:${PORT} (${process.env.NODE_ENV})`);
    console.log(` Routes:`);
    console.log(`   GET    /users          → Danh sách users (Admin)`);
    console.log(`   GET    /users/me       → Profile bản thân`);
    console.log(`   GET    /users/stats    → Thống kê (Admin)`);
    console.log(`   GET    /users/:id      → Thông tin user (Admin)`);
    console.log(`   PUT    /users/:id      → Cập nhật thông tin`);
    console.log(`   PATCH  /users/:id/role → Phân quyền (Admin)`);
    console.log(`   DELETE /users/:id      → Xóa user (Admin)`);
  });
};

startServer();

export default app;
