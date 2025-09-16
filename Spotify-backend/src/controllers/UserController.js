import UserService from "../services/UserService.js";
import mongoose from "mongoose";
import { generateTokens } from '../utils/authUtils.js';
import { v2 as cloudinary } from "cloudinary";



const register = async (req, res) => {
  try {
    const { email, password, username, dateOfBirth, gender } = req.body;

    // Validate required fields
    if (!email || !password || !username || !dateOfBirth || !gender) {
      return res.status(400).json({ 
        status: "Error",
        message: "Missing required fields" 
      });
    }

    // Validate date of birth structure
    if (!dateOfBirth.day || !dateOfBirth.month || !dateOfBirth.year) {
      return res.status(400).json({
        status: "Error",
        message: "Invalid date of birth format"
      });
    }

    // Validate gender
    const validGenders = ['man', 'woman', 'non-binary', 'something-else', 'prefer-not-to-say'];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        status: "Error",
        message: "Invalid gender value"
      });
    }

    const result = await UserService.register({
      email,
      password,
      username,
      dateOfBirth,
      gender
    });

    res.status(201).json({
      status: "Success",
      message: "User registered successfully",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    console.error("Registration error:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ 
      status: "Error",
      message: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    // Accept 'identifier' which can be email or username
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ 
        status: "Error",
        message: "Email/Username and password are required" // Update message
      });
    }

    const result = await UserService.login(identifier, password);

    res.status(200).json({
      status: "Success",
      message: "Login successful",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    console.error("Login error:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ 
      status: "Error",
      message: error.message 
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: "Error",
        message: "Refresh token is required"
      });
    }

    const result = await UserService.refreshToken(refreshToken);

    res.status(200).json({
      status: "Success",
      message: "Token refreshed successfully",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({
      status: "Error",
      message: error.message
    });
  }
};


const createPlaylist = async (req, res) => {
  try {
    // Lấy user ID từ đối tượng request (giả định đã được đính kèm bởi middleware xác thực)
    const userId = req.user._id; // Điều chỉnh nếu cấu trúc user trong req khác

    // Lấy tên và mô tả từ body của request
    const { name, desc } = req.body; // Không đọc 'songs' từ body

    const imageFile = req.file;

    // Kiểm tra xem có file ảnh được upload không nếu trường image là bắt buộc
    if (!imageFile) {
      return res.status(400).json({ error: "Missing image file" });
    }

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",

    });

    const playlist = await UserService.createPlaylist({
      name, // Sử dụng tên trường 'name'
      desc,
      owner: userId, // Gán playlist cho người tạo
      image: imageUpload.secure_url,
      songs: [] // Luôn truyền mảng rỗng cho songs
    });

    // Trả về playlist vừa tạo thành công
    res.status(201).json(playlist);

  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ message: "Failed to create playlist", error: error.message });
  }
};

// New function to update user role
const updateRole = async (req, res) => {
  try {
    // Lấy ID user cần cập nhật và vai trò mới từ body của request
    // Có thể lấy userId từ params nếu route là /update-role/:userId
    const { userId, newRole } = req.body; 

    // TODO: Thêm kiểm tra quyền admin ở đây (nếu chưa có middleware)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ status: "Error", message: "Forbidden" });
    // }

    // Kiểm tra userId có phải là ObjectId hợp lệ không
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
       return res.status(400).json({ status: "Error", message: "Invalid or missing userId" });
    }

    const updatedUser = await UserService.updateUserRole(userId, newRole);

    res.status(200).json({
      status: "Success",
      message: "User role updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update user role error:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ 
      status: "Error",
      message: error.message 
    });
  }
};

// New function to list all users
const listUsers = async (req, res) => {
  try {
    // TODO: Add admin authentication middleware here
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ status: "Error", message: "Forbidden" });
    // }

    const users = await UserService.listUsers();

    res.status(200).json({
      status: "Success",
      message: "Users retrieved successfully",
      users: users,
    });

  } catch (error) {
    console.error("List users error:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ 
      status: "Error",
      message: error.message 
    });
  }
};

export default {
  register,
  login,
  refreshToken,
  createPlaylist,
  updateRole,
  listUsers,
};

















