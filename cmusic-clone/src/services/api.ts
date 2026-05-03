import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Tự động gắn Token vào mỗi Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Xử lý Refresh Token khi gặp lỗi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (mã lỗi từ server bạn là hết hạn) và chưa từng retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token available");

        // Gọi API refresh (Auth Service chạy qua Gateway)
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        
        if (res.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;
          
          // Lưu token mới
          localStorage.setItem("token", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Cập nhật token cho request hiện tại và thực hiện lại
          console.log("[API]: Token refreshed successfully. Retrying request...");
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("[API]: Refresh token failed", refreshError);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        // Chỉ redirect sang /login khi đang ở trang cần xác thực (admin, upload, profile...)
        // KHÔNG redirect từ trang public (trang chủ, trang nghệ sĩ, album...) để tránh vòng lặp vô tận
        const protectedPaths = ["/admin", "/upload", "/profile", "/settings"];
        const isOnProtectedPage = protectedPaths.some(path => window.location.pathname.startsWith(path));
        if (isOnProtectedPage) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default api;
