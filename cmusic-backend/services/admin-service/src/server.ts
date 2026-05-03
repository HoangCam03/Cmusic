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
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/cmusic");
    console.log("Admin-service: MongoDB kết nối thành công");
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

// ===== HEALTH CHECK =====
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", service: "admin-service" });
});


app.get(["/stats", "/admin/stats", "/api/admin/stats"], (_req: Request, res: Response) => {
  res.json({ message: "Get statistics endpoint — coming soon" });
});

app.get(["/logs", "/admin/logs", "/api/admin/logs"], (_req: Request, res: Response) => {
  res.json({ message: "Get audit logs endpoint — coming soon" });
});

// ===== START SERVER =====
const startServer = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(` Admin Service running at http://localhost:${PORT} (${process.env.NODE_ENV})`);
    console.log(` GET/POST/PUT/DELETE /admin/permissions`);
    console.log(` GET/POST/PUT/DELETE /admin/plan-features`);
  });
};

startServer();

export default app;
