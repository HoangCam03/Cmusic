import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes";
import { errorMiddleware } from "@spotify/libs/middleware/error.middleware";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.AUTH_SERVICE_PORT || "3001", 10);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DATABASE CONNECTION =====
const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://mongodb:27017/cmusic";
  console.log(`Đang kết nối tới MongoDB tại: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB kết nối thành công (Auth Service)");
  } catch (error) {
    console.error(
      "Lỗi kết nối MongoDB:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

// ===== ROUTES =====

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", service: "auth-service" });
});

// Auth Routes (Gắn prefix cho các route)
app.use("/auth", authRoutes);

// ===== GLOBAL ERROR HANDLING =====
app.use(errorMiddleware as any);

// ===== START SERVER =====
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      `Auth Service đang chạy tại http://localhost:${PORT} (${process.env.NODE_ENV})`
    );
  });
};

startServer();

export default app;
