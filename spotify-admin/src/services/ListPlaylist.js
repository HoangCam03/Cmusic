export const getAllPlaylists = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/playlist/list-playlists`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching playlists:", error);
    throw error;
  }
}; 