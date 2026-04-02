import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PLAYLIST_SERVICE_PORT || "3004", 10);

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
  res.json({ status: "OK", service: "playlist-service" });
});

// Playlist routes placeholder
app.post("/playlists", (req: Request, res: Response) => {
  res.json({ message: "Create playlist endpoint" });
});

app.get("/playlists/:playlistId", (req: Request, res: Response) => {
  res.json({ message: "Get playlist endpoint" });
});

app.put("/playlists/:playlistId", (req: Request, res: Response) => {
  res.json({ message: "Update playlist endpoint" });
});

app.delete("/playlists/:playlistId", (req: Request, res: Response) => {
  res.json({ message: "Delete playlist endpoint" });
});

app.post("/playlists/:playlistId/tracks", (req: Request, res: Response) => {
  res.json({ message: "Add track to playlist endpoint" });
});

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
