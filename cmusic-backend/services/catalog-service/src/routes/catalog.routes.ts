import { Router } from "express";
import { catalogController } from "../controllers/catalog.controller";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../services/cloudinary.service";

// Cấu hình Multer để upload đồng thời Audio và Cover
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cmusic/tracks",
    resource_type: "auto",
  } as any,
});

const upload = multer({ storage });

const router = Router();

// /tracks
router.get("/tracks", catalogController.getTracks);

// /tracks/:trackId
router.get("/tracks/:trackId", catalogController.getTrackById);

// /tracks (POST - Artist only, supports file upload for audio and cover)
router.post(
  "/tracks",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  catalogController.createTrack
);

export default router;


