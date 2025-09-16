import express from "express";
import { addPlaylist, listPlaylists, deletePlaylist, updatePlaylist, checkPlaylistPermission } from "../controllers/PlaylistController.js";
import { authenticateToken, authorizeAdmin } from "../middleware/authMiddleware.js";
const router = express.Router();

import upload from "../middleware/multer.js";

// Route lấy danh sách playlist - không yêu cầu xác thực
router.get("/list-playlists", listPlaylists);

// Các route khác yêu cầu xác thực
router.use(authenticateToken);

// Route tạo playlist mới - chỉ admin mới được tạo playlist hệ thống
router.post("/add-playlist", upload.single('image'), addPlaylist);

// Route xóa playlist - yêu cầu kiểm tra quyền
router.delete("/delete-playlist/:_id", checkPlaylistPermission, deletePlaylist);

// Route cập nhật playlist - yêu cầu kiểm tra quyền
router.put("/update-playlist/:_id", upload.single('image'), checkPlaylistPermission, updatePlaylist);

export default router;