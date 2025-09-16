import Playlist from "../models/playlistModel.js";
import User from "../models/userModel.js";

const createPlaylist = (playlistData) => {
  return new Promise(async (resolve, reject) => {
    const { name, desc, bgcolor, image, createdBy } = playlistData;
    try {
      // Kiểm tra user tồn tại và lấy role
      const user = await User.findById(createdBy);
      if (!user) {
        resolve({
          status: "error",
          message: "User not found",
        });
        return;
      }

      // Kiểm tra playlist đã tồn tại chưa
      const existingPlaylist = await Playlist.findOne({ name });
      if (existingPlaylist !== null) {
        resolve({
          status: "error",
          message: "Playlist already exists",
        });
        return;
      }
      // Xác định type của playlist dựa vào role của user
      const playlistType = user.role === 'admin' ? 'system' : 'personal';

      // Tạo playlist mới
      const playlist = await Playlist.create({
        name,
        desc,
        bgcolor,
        image,
        type: playlistType,
        createdBy,
        owner: playlistType === 'personal' ? createdBy : null // Chỉ set owner nếu là playlist cá nhân
      });

      // Nếu là playlist cá nhân, thêm vào danh sách createdPlaylists của user
      if (playlistType === 'personal') {
        await User.findByIdAndUpdate(createdBy, {
          $push: { createdPlaylists: playlist._id }
        });
      }

      resolve({
        status: "success",
        message: "Playlist created successfully",
        data: playlist,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const listPlaylists = (userId = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      let query = {};
      
      // Luôn lấy playlist hệ thống cho tất cả user
      if (userId) {
        // Nếu có userId, lấy cả playlist hệ thống và playlist cá nhân của user đó
        query = {
          $or: [
            { type: 'system' }, // Luôn lấy playlist hệ thống
            { type: 'personal', createdBy: userId } // Chỉ lấy playlist cá nhân của user đó
          ]
        };
      } else {
        // Nếu không có userId (trường hợp này không nên xảy ra vì đã có middleware auth)
        // nhưng vẫn trả về playlist hệ thống để đảm bảo an toàn
        query = { type: 'system' };
      }

      const playlists = await Playlist.find(query)
        .populate('createdBy', 'username email role')
        .populate('owner', 'username email')
        .sort({ type: 1, createdAt: -1 }); // Sắp xếp: playlist hệ thống trước, sau đó đến playlist cá nhân, mới nhất lên đầu

      resolve({
        status: "success",
        message: "Playlists fetched successfully",
        data: playlists,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const deletePlaylist = async (playlistId) => {
  try {
    const checkPlaylist = await Playlist.findOne({ _id: playlistId });
    
    if (!checkPlaylist) {
      return {
        status: "ERROR",
        message: "The Playlist is not defined",
      };
    }

    await Playlist.findByIdAndDelete(playlistId);
    return {
      status: "Success",
      message: "Playlist deleted successfully",
      data: checkPlaylist
    };
  } catch (error) {
    console.error("Delete playlist failed", error.message);
    throw error;
  }
};

// New function to update a playlist
const updatePlaylist = async (playlistId, updatedFields) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(playlistId, updatedFields, { new: true });
    return playlist;
  } catch (error) {
    console.error("Update playlist failed", error.message);
    throw error;
  }
};

export default {
  createPlaylist,
  listPlaylists,
  deletePlaylist,
  updatePlaylist,
};