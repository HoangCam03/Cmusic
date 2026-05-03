import api from "../api";

export const getAllSongs = async () => {
  try {
    const response = await api.get("/catalog/tracks");
    return response.data;
  } catch (error: any) {
    console.error("Get songs error:", error);
    throw error;
  }
};

export const getSongById = async (songId: string) => {
  try {
    const response = await api.get(`/catalog/tracks/${songId}`);
    return response.data;
  } catch (error: any) {
    console.error("Get song error:", error);
    throw error;
  }
};

export const getArtistSongs = async (artistId: string) => {
  try {
    const response = await api.get(`/catalog/tracks/artist/${artistId}`);
    return response.data;
  } catch (error: any) {
    console.error("Get artist songs error:", error);
    throw error;
  }
};

export const getRecommendedSongs = async (trackId: string) => {
  try {
    const response = await api.get(`/catalog/tracks/${trackId}/recommended`);
    return response.data;
  } catch (error: any) {
    console.error("Get recommended songs error:", error);
    throw error;
  }
};

export const trackPlay = async (trackId: string) => {
  try {
    await api.patch(`/catalog/tracks/${trackId}/play`);
  } catch (error) {
    console.error("Error updating play count:", error);
  }
};

export const recordPlayHistory = async (trackId: string) => {
  try {
    await api.post('/history/play', { trackId });
  } catch (error) {
    console.error("Error recording play history:", error);
  }
};

