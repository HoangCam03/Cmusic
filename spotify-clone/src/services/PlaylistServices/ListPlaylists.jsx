export const getAllPlaylists = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    const headers = token ? {
      'Authorization': `Bearer ${token}`
    } : {};

    const res = await fetch(`${import.meta.env.VITE_API_URL}/playlist/list-playlists`, {
      headers
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.error("Authentication failed");
        return { status: "success", playlists: [] };
      }
      throw new Error('Failed to fetch playlists');
    }

    const data = await res.json();
    console.log("Playlist API response:", data); // Debug log
    return data;
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return { status: "error", message: error.message };
  }
}; 