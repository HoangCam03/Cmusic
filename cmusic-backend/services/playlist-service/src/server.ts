import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { mongoose } from "@spotify/libs";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PLAYLIST_SERVICE_PORT || "3004", 10);

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
import playlistRoutes from "./routes/playlist.routes";
import { errorMiddleware } from "@spotify/libs/middleware/error.middleware";

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", service: "playlist-service" });
});

// Playlist APIs
app.use("/", playlistRoutes);

// Error handling
app.use(errorMiddleware as any);

// ===== START SERVER =====
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      ` Playlist Service đang chạy tại http://localhost:${PORT} (${process.env.NODE_ENV})`
    );
  });
};

startServer();

export default app;
