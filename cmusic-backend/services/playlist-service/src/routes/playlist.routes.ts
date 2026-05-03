import { Router } from "express";
import { playlistController } from "../controllers/playlist.controller";
import { authenticate } from "@spotify/libs/middleware/auth.middleware";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../services/cloudinary.service";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    return {
      folder: "cmusic/playlists",
      resource_type: "image",
    };
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Tăng hẳn lên 50MB
});
const router = Router();

// Route công khai (Không cần đăng nhập)
router.get("/public", playlistController.getPublicPlaylists as any);

// Các route bên dưới yêu cầu đăng nhập
router.use(authenticate as any);

router.post("/", playlistController.createPlaylist as any);
router.get("/me", playlistController.getMyPlaylists as any);
router.post("/add-track", playlistController.addTrackToPlaylist as any);
router.post("/remove-track", playlistController.removeTrackFromPlaylist as any);

// Route có tham số :id đặt cuối cùng để tránh xung đột
router.get("/:id", playlistController.getPlaylistById as any);

// Route cập nhật playlist - hỗ trợ upload ảnh bìa
router.put("/:id", upload.single('thumbnail'), playlistController.updatePlaylist as any);

router.delete("/:id", playlistController.deletePlaylist as any);

export default router;
