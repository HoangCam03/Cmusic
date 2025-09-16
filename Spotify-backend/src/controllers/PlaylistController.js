import { v2 as cloudinary } from "cloudinary";
import PlaylistService from "../services/PlaylistService.js";
import User from "../models/userModel.js";
import Playlist from "../models/playlistModel.js";

// Middleware kiểm tra quyền xóa/cập nhật playlist
export const checkPlaylistPermission = async (req, res, next) => {
  try {
    const playlistId = req.params._id;
    const userId = req.user.id; // Thay đổi từ req.user._id thành req.user.id vì token payload chứa id
    const user = await User.findById(userId);

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Admin có thể thao tác với mọi playlist
    if (user.role === 'admin') {
      return next();
    }

    // User thường chỉ có thể thao tác với playlist cá nhân của họ
    if (playlist.type === 'personal' && playlist.createdBy.toString() === userId) {
      return next();
    }

    return res.status(403).json({ error: "You don't have permission to perform this action" });
  } catch (error) {
    console.error("Permission check error:", error);
    return res.status(500).json({ error: "Error checking permissions" });
  }
};

// Controller functions
const addPlaylist = async (req, res) => {
  try {
    console.log("request body", req.body);
    console.log("files", req.file);

    const { name, desc, bgcolor } = req.body;
    const imageFile = req.file;
    const createdBy = req.user.id; // Thay đổi từ req.user._id thành req.user.id

    if (!name || !desc || !bgcolor) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!imageFile) {
      return res.status(400).json({ error: "Missing image file" });
    }
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });

    //Gọi service lưu vào DB
    const newPlaylist = await PlaylistService.createPlaylist({
      name,
      desc,
      bgcolor,
      image: imageUpload.secure_url,
      createdBy,
    });

    if (newPlaylist.status === "error") {
      return res.status(400).json({ error: newPlaylist.message });
    }

    res.status(201).json({
      message: "Upload & save successful",
      playlist: newPlaylist.data,
    });
  } catch (error) {
    console.error("Upload failed", error.message);
    const message =
      error.message === "Playlist already exists"
        ? error.message
        : "Upload failed";
    const statusCode = error.message === "Playlist already exists" ? 400 : 500;

    res.status(statusCode).json({ error: message });
  }
};

const listPlaylists = async (req, res) => {
  try {
    // Nếu không có token, chỉ trả về playlist hệ thống
    if (!req.user) {
      const serviceResult = await PlaylistService.listPlaylists();
      if (serviceResult.status === "success" && serviceResult.data) {
        // Lọc chỉ lấy playlist hệ thống
        const systemPlaylists = serviceResult.data.filter(playlist => playlist.type === 'system');
        return res.status(200).json({
          message: "System playlists fetched successfully",
          playlists: systemPlaylists,
        });
      }
      return res.status(500).json({
        message: serviceResult.message || "Failed to fetch system playlists",
      });
    }

    // Nếu có token, xử lý như bình thường
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Nếu là admin, lấy tất cả playlist
    const serviceResult = user?.role === 'admin' 
      ? await PlaylistService.listPlaylists() 
      : await PlaylistService.listPlaylists(userId);
    
    if (serviceResult.status === "success" && serviceResult.data) {
      res.status(200).json({
        message: "Playlists fetched successfully",
        playlists: serviceResult.data,
      });
    } else {
      res.status(serviceResult.status === "error" ? 400 : 500).json({
        message: serviceResult.message || "Failed to fetch playlists from service",
      });
    }
  } catch (error) {
    console.error("Fetch playlists failed in controller", error);
    res.status(500).json({ message: "Failed to fetch playlists", error: error.message });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const playlistId = req.params._id;
    const userId = req.user.id; // Thay đổi từ req.user._id thành req.user.id
    const user = await User.findById(userId);

    // Kiểm tra playlist tồn tại
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Nếu là playlist cá nhân, xóa khỏi danh sách createdPlaylists của user
    if (playlist.type === 'personal') {
      await User.findByIdAndUpdate(userId, {
        $pull: { createdPlaylists: playlistId }
      });
    }

    const deletedPlaylist = await PlaylistService.deletePlaylist(playlistId);
    if (deletedPlaylist.status === "ERROR") {
      return res.status(404).json({ error: deletedPlaylist.message });
    }

    res.status(200).json({
      status: "Success",
      message: "Playlist deleted successfully",
      playlist: deletedPlaylist.data,
    });
  } catch (error) {
    console.error("Delete failed", error.message);
    res.status(500).json({ error: "Delete failed" });
  }
};

const updatePlaylist = async (req, res) => {
  try {
    const playlistId = req.params._id;
    const userId = req.user.id;
    const { name, desc, bgcolor } = req.body;
    const imageFile = req.file;

    // Kiểm tra playlist tồn tại và quyền sở hữu
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const user = await User.findById(userId);
    if (user.role !== 'admin' && 
        (playlist.type !== 'personal' || playlist.createdBy.toString() !== userId)) {
      return res.status(403).json({ error: "You don't have permission to update this playlist" });
    }

    let updatedFields = { name, desc, bgcolor };

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      updatedFields.image = imageUpload.secure_url;
    }

    const updatedPlaylist = await PlaylistService.updatePlaylist(playlistId, updatedFields);

    if (updatedPlaylist) {
      res.status(200).json({
        message: "Playlist updated successfully",
        playlist: updatedPlaylist,
      });
    } else {
      res.status(404).json({ error: "Playlist not found" });
    }
  } catch (error) {
    console.error("Update playlist failed", error.message);
    res.status(500).json({ error: "Update playlist failed" });
  }
};

// Export tất cả các functions
export {
  addPlaylist,
  listPlaylists,
  deletePlaylist,
  updatePlaylist
};
