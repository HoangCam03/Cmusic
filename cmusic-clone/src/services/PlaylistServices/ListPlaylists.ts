import api from "../api";

// 1. Lấy tất cả playlist của người dùng hiện tại
export const getMyPlaylists = async () => {
  try {
    const response = await api.get("/playlists/me");
    return response.data;
  } catch (error) {
    console.error("Lấy danh sách playlist thất bại:", error);
    throw error;
  }
};

// 2. Tạo playlist mới
export const createPlaylist = async () => {
  try {
    const response = await api.post("/playlists");
    return response.data;
  } catch (error) {
    console.error("Tạo playlist thất bại:", error);
    throw error;
  }
};

// 3. Thêm bài hát vào playlist
export const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
  try {
    const response = await api.post("/playlists/add-track", { playlistId, trackId });
    return response.data;
  } catch (error) {
    console.error("Thêm bài hát vào playlist thất bại:", error);
    throw error;
  }
};

// 4. Lấy chi tiết playlist
export const getPlaylistDetail = async (id: string) => {
  try {
    const response = await api.get(`/playlists/${id}`);
    return response.data;
  } catch (error) {
    console.error("Lấy chi tiết playlist thất bại:", error);
    throw error;
  }
};
