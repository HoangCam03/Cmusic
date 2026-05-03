import axios from "axios";

// Sử dụng biến môi trường hoặc mặc định port 3000 (API Gateway v2.0)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const userSignUp = async (userData: { username?: string; email: string; password?: string; displayName?: string }) => {
  try {
    // Gọi đến API Gateway v2.0 (/api/auth/register)
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error: any) {
    console.error("Sign up error:", error);
    throw error;
  }
};

export const verifyEmail = async (email: string, otp: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-email`, { email, otp });
    return response.data;
  } catch (error: any) {
    console.error("Verify email error:", error);
    throw error;
  }
};

export const resendOtp = async (email: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/resend-otp`, { email });
    return response.data;
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    throw error;
  }
};


