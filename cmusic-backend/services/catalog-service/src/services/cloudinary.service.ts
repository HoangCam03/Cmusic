import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình Multer Storage cho Cloudinary bài hát
const songStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cmusic/songs",
    resource_type: "auto", // Quan trọng để hỗ trợ file mp3/mp4/audio
    allowed_formats: ["mp3", "wav", "m4a", "flac"]
  } as any,
});

// Cấu hình Multer Storage cho Ảnh bìa
const coverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cmusic/covers",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  } as any,
});

export const uploadSong = multer({ storage: songStorage });
export const uploadCover = multer({ storage: coverStorage });

export default cloudinary;
