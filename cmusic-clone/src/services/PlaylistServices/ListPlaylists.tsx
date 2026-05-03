import api from "../api";

export const getAllPlaylists = async () => {
  try {
    const response = await api.get("/playlists");
    return response.data;
  } catch (error) {
    console.error("Get playlists error:", error);
    throw error;
  }
};


export const getUserPlaylists = async (userId: string) => {
  try {
    const response = await api.get(`/playlists/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Get user playlists error:", error);
    throw error;
  }
};
