import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.HISTORY_SERVICE_PORT || "3006", 10);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

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

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", service: "history-service" });
});

// History routes placeholder
app.post("/history/play", (req: Request, res: Response) => {
  res.json({ message: "Record play event endpoint" });
});

app.get("/history/recently-played", (req: Request, res: Response) => {
  res.json({ message: "Get recently played endpoint" });
});

// ===== START SERVER =====
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      ` History Service đang chạy tại http://localhost:${PORT} (${process.env.NODE_ENV})`
    );
  });
};

startServer();

export default app;
