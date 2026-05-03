import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { mongoose } from "@spotify/libs/database";
import catalogRoutes from "./routes/catalog.routes";
import { errorMiddleware } from "@spotify/libs/middleware/error.middleware";


dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.CATALOG_SERVICE_PORT || "3003", 10);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ===== DATABASE CONNECTION =====
const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/cmusic";
  console.log(`[CATALOG] Đang kết nối tới MongoDB: ${uri}`);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout sau 5s nếu không thấy Server
    });
    console.log(" [CATALOG] MongoDB kết nối thành công");
  } catch (error) {
    console.error(" [CATALOG] Lỗi kết nối MongoDB:", error);
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      ` Catalog Service đang chạy tại http://0.0.0.0:${PORT} (${process.env.NODE_ENV})`
    );
  });
};

startServer();

export default app;
