import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

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
    console.log("✅ MongoDB kết nối thành công");
  } catch (error) {
    console.error(
      "❌ Lỗi kết nối MongoDB:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

// ===== ROUTES =====

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", service: "user-service" });
});

// User routes placeholder
app.get("/users/:userId", (req: Request, res: Response) => {
  res.json({ message: "Get user endpoint" });
});

app.get("/users/profile/:userId", (req: Request, res: Response) => {
  res.json({ message: "Get profile endpoint" });
});

app.put("/users/profile/:userId", (req: Request, res: Response) => {
  res.json({ message: "Update profile endpoint" });
});

app.post("/users/:userId/follow", (req: Request, res: Response) => {
  res.json({ message: "Follow user endpoint" });
});

// ===== START SERVER =====
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      `User Service đang chạy tại http://localhost:${PORT} (${process.env.NODE_ENV})`
    );
  });
};

startServer();

export default app;
