import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.ADMIN_SERVICE_PORT || "3008", 10);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DATABASE CONNECTION =====
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/spotify");
    console.log("MongoDB kết nối thành công");
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
  res.json({ status: "OK", service: "admin-service" });
});

// Admin routes placeholder
app.get("/admin/stats", (req: Request, res: Response) => {
  res.json({ message: "Get statistics endpoint" });
});

app.get("/admin/logs", (req: Request, res: Response) => {
  res.json({ message: "Get audit logs endpoint" });
});

app.post("/admin/cms", (req: Request, res: Response) => {
  res.json({ message: "CMS endpoint" });
});

// ===== START SERVER =====
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      ` Admin Service đang chạy tại http://localhost:${PORT} (${process.env.NODE_ENV})`
    );
  });
};

startServer();

export default app;
