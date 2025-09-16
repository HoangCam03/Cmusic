import User from "../models/userModel.js";
import bcrypt from 'bcrypt';
import { generateTokens } from '../utils/authUtils.js';
import { connections } from "mongoose";
import Playlist from '../models/playlistModel.js';

// Hàm để xử lý logic đăng ký
const register = async (userData) => {
  const { email, password, username, dateOfBirth, gender } = userData;

  // Validate required fields
  if (!email || !password || !username || !dateOfBirth || !gender) {
    const error = new Error("Missing required fields");
    error.status = 400;
    throw error;
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email already exists");
    error.status = 409; // Conflict
    throw error;
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user
  const newUser = new User({
    email,
    password: hashedPassword,
    username,
    dateOfBirth: {
      day: dateOfBirth.day,
      month: dateOfBirth.month,
      year: dateOfBirth.year
    },
    gender
  });

  await newUser.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(newUser);
  
  // Save refresh token
  newUser.refreshToken = refreshToken;
  await newUser.save();

  // Return user data without sensitive information
  const userObject = newUser.toObject();
  delete userObject.password;
  delete userObject.refreshToken;

  return {
    user: userObject,
    accessToken,
    refreshToken
  };
};

// Hàm để xử lý logic đăng nhập
const login = async (identifier, password) => {
  // Find user by email or username, explicitly selecting password
  const user = await User.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  }).select('+password');

  if (!user) {
    const error = new Error("Invalid credentials"); // Use a generic message for security
    error.status = 401; // Unauthorized
    throw error;
  }

  // Verify password
  // Password verification is done against the found user document
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid credentials");
    error.status = 401; // Unauthorized
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user);

  // Update refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Return user data without sensitive information
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.refreshToken;

  return {
    user: userObject,
    accessToken,
    refreshToken
  };
};

// Hàm refresh token
const refreshToken = async (token) => {
  const user = await User.findOne({ refreshToken: token });
  
  if (!user) {
    const error = new Error("Invalid refresh token");
    error.status = 401;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user);
  
  // Update refresh token
  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken
  };
};


const createPlaylist = async (playlistData) => {
  try {
    // Destructure data from playlistData
    const { name, desc, owner, image, songs } = playlistData;

    // Create a new playlist instance using the Playlist model
    const newPlaylist = new Playlist({
      name,
      desc,
      owner,
      image,
      songs: songs || [] // Ensure songs is an array, default to empty array
    });

    // Save the new playlist to the database
    const savedPlaylist = await newPlaylist.save();

    // TODO: Optionally update the User model to include the new playlist ID
    // Example: await User.findByIdAndUpdate(owner, { $push: { createdPlaylists: savedPlaylist._id } });

    // Return a plain object of the saved playlist to ensure all fields are included
    return savedPlaylist.toObject(); 

  } catch (error) {
    console.error("Error creating playlist in service:", error);
    // Propagate the error to the controller
    throw error; 
  }
};

// New function to update a user's role
const updateUserRole = async (userId, newRole) => {
  try {
    // Validate newRole to ensure it's either 'user' or 'admin'
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(newRole)) {
      const error = new Error("Invalid role specified");
      error.status = 400;
      throw error;
    }

    // Find the user by ID and update their role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // Return the updated user document (excluding password and refreshToken for safety)
    const userObject = updatedUser.toObject();
    delete userObject.password;
    delete userObject.refreshToken;

    return userObject;

  } catch (error) {
    console.error("Error updating user role in service:", error);
    throw error;
  }
};

// New function to list all users
const listUsers = async () => {
  try {
    // Find all users in the database, excluding password and refreshToken
    const users = await User.find({}).select('-password -refreshToken');

    return users;
  } catch (error) {
    console.error("Error listing users in service:", error);
    throw error;
  }
};

export default {
  register,
  login,
  refreshToken,
  createPlaylist,
  updateUserRole,
  listUsers,
};