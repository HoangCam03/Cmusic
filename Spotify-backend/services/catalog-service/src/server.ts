import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import catalogRoutes from "./routes/catalog.routes.js";
import { errorMiddleware } from "@libs/middleware/error.middleware.js";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.CATALOG_SERVICE_PORT || "3003", 10);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DATABASE CONNECTION =====
const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/spotify");
    console.log(" MongoDB kết nối thành công (Catalog Service)");
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
  res.json({ status: "OK", service: "catalog-service" });
});

// Catalog Routes
app.use("/", catalogRoutes);

// ===== GLOBAL ERROR HANDLING =====
app.use(errorMiddleware as any);

// ===== START SERVER =====
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      `✅ Catalog Service đang chạy tại http://localhost:${PORT} (${process.env.NODE_ENV})`
    );
  });
};

startServer();

export default app;
