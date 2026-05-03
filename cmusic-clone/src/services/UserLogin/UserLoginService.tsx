import axios from "axios";
import api from "../api";

// Sử dụng biến môi trường hoặc mặc định port 3000 (API Gateway v2.0)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const userLogin = async (email: string, password: string) => {
  try {
    // Gọi đến API Gateway v2.0 (/api/auth/login) - Dùng axios trực tiếp vì chưa có token
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    if (response.data && response.data.success) {
      const { accessToken, refreshToken, user } = response.data.data || {};
      
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      
      return response.data;
    }
    
    return response.data;
  } catch (error: any) {
    console.error("Login error:", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    // Dùng instance 'api' để tự động gắn Token
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Get user profile error:", error);
    throw error;
  }
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  try {
    const response = await api.post("/auth/change-password", { oldPassword, newPassword });
    return response.data;
  } catch (error) {
    console.error("Change password error:", error);
    throw error;
  }
};

