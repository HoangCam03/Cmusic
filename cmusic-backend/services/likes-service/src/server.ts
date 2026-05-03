import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { mongoose } from "@spotify/libs/database";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.LIKES_SERVICE_PORT || "3005", 10);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`[LIKES-SERVICE]: ${req.method} ${req.path}`);
  next();
});

// ===== DATABASE CONNECTION =====
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/spotify");
    console.log(" MongoDB kết nối thành công");
  } catch (error) {
    console.error(
      " Lỗi kết nối MongoDB:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

// ===== ROUTES =====

import likesRoutes from "./routes/likes.routes";

// ... health check ...
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", service: "likes-service" });
});

// Likes routes
app.use("/", likesRoutes);

// ===== START SERVER =====
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      `🚀 Likes Service đang chạy tại http://localhost:${PORT} (${process.env.NODE_ENV})`
    );
  });
};

startServer();

export default app;
