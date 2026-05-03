import api from "../api";

/**
 * Lấy danh sách tất cả người dùng (Admin)
 */
export const getAllUsers = async (page = 1, limit = 20, search = "") => {
  try {
    const response = await api.get("/users", {
      params: { page, limit, search }
    });
    return response.data;
  } catch (error: any) {
    console.error("Get all users error:", error);
    throw error;
  }
};

/**
 * Lấy thống kê người dùng (Admin)
 */
export const getUserStats = async () => {
  try {
    const response = await api.get("/users/stats");
    return response.data;
  } catch (error: any) {
    console.error("Get user stats error:", error);
    throw error;
  }
};

/**
 * Cập nhật vai trò người dùng (Admin)
 */
export const updateUserRole = async (userId: string, role: string) => {
  try {
    const response = await api.patch(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error: any) {
    console.error("Update user role error:", error);
    throw error;
  }
};

/**
 * Xóa người dùng (Admin)
 */
export const deleteUser = async (userId: string) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error("Delete user error:", error);
    throw error;
  }
};

/**
 * Tạo người dùng mới (Admin)
 */
export const createUser = async (userData: any) => {
  try {
    const response = await api.post("/users", userData);
    return response.data;
  } catch (error: any) {
    console.error("Create user error:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin người dùng
 */
export const updateUserProfile = async (userId: string, userData: any) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error: any) {
    console.error("Update user error:", error);
    throw error;
  }
};

/**
 * Lấy profile cá nhân
 */
export const getMyProfile = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error: any) {
    console.error("Get my profile error:", error);
    throw error;
  }
};

