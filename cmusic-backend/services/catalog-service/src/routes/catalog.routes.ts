import { Router } from "express";
import { catalogController } from "../controllers/catalog.controller";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../services/cloudinary.service";
import { authenticate, requireRole } from "@spotify/libs/middleware/auth.middleware";

// Cấu hình Multer để upload đồng thời Audio và Cover
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    const isAudio = file.fieldname === 'audio';
    return {
      folder: isAudio ? "cmusic/tracks/audio" : "cmusic/tracks/covers",
      resource_type: "auto",
    };
  },
});

const upload = multer({ storage });

const router = Router();

// Lấy danh sách bài hát
router.get("/tracks", catalogController.getTracks);

// Lấy chi tiết một bài hát
router.get("/tracks/:trackId", catalogController.getTrackById);

// Lấy danh sách bài hát theo Nghệ sĩ
router.get("/tracks/artist/:artistId", catalogController.getTracksByArtist);

// Tăng lượt nghe
router.patch("/tracks/:trackId/play", catalogController.incrementPlayCount);

// Lấy gợi ý bài hát liên quan
router.get("/tracks/:trackId/recommended", catalogController.getRecommendedTracks);

// Lấy danh sách bình luận
router.get("/tracks/:trackId/comments", catalogController.getCommentsByTrackId);

// Thêm bình luận (Cần đăng nhập - Gateway đã xác thực và truyền x-user-id)
router.post("/tracks/comments", catalogController.addComment);

// Xóa bình luận
router.delete("/tracks/comments/:commentId", catalogController.deleteComment);

// ─── Protected Routes (Cần xác thực + phân quyền) ────────────────────────────

// Tải nhạc lên
router.post(
  "/tracks",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  catalogController.createTrack
);

// Cập nhật thông tin bài hát (Đầy đủ - Multipart)
router.put(
  "/tracks/:trackId",
  upload.fields([{ name: "cover", maxCount: 1 }]),
  catalogController.updateTrack
);

// Cập nhật thông tin bài hát (Nhanh - JSON)
router.patch(
  "/tracks/:trackId",
  catalogController.updateTrack
);

// Xóa bài hát 
router.delete(
  "/tracks/:trackId",
  catalogController.deleteTrack
);

// ─── ARTIST ROUTES ───────────────────────────────────────────────────────

// Lấy danh sách nghệ sĩ
router.get("/artists", catalogController.getArtists);

// Lấy chi tiết nghệ sĩ
router.get("/artists/:artistId", catalogController.getArtistById);

// Thêm nghệ sĩ mới (Admin)
router.post(
  "/artists",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  catalogController.createArtist
);

// Cập nhật nghệ sĩ (Admin)
router.put(
  "/artists/:artistId",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  catalogController.updateArtist
);

// Xóa nghệ sĩ (Admin)
router.get("/artists/:artistId/follow/check", catalogController.checkFollowStatus);
router.post("/artists/:artistId/follow", catalogController.followArtist);
router.delete("/artists/:artistId/follow", catalogController.unfollowArtist);
router.delete("/artists/:artistId", catalogController.deleteArtist);

// ─── ALBUM ROUTES ────────────────────────────────────────────────────────

// Lấy danh sách Album
router.get("/albums", catalogController.getAlbums);

// Lấy chi tiết Album
router.get("/albums/:albumId", catalogController.getAlbumById);

// Tạo Album mới (Admin/Artist)
router.post(
  "/albums",
  upload.fields([{ name: "cover", maxCount: 1 }]),
  catalogController.createAlbum
);

// Cập nhật Album
router.put(
  "/albums/:albumId",
  upload.fields([{ name: "cover", maxCount: 1 }]),
  catalogController.updateAlbum
);

// Xóa Album
router.delete("/albums/:albumId", catalogController.deleteAlbum);

export default router;
