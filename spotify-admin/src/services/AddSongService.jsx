import axios from "axios";

export const addSong = async (songData, accessToken) => {
    const formData = new FormData();
    formData.append("song", songData.get("song"));
    formData.append("image", songData.get("image"));
    formData.append("name", songData.get("name"));  
    formData.append("artist", songData.get("artist"));
    formData.append("description", songData.get("description"));
    formData.append("album", songData.get("album"));
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/songs/add`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error adding song:", error);
        if (error.response) {
             console.error("Error response data:", error.response.data);
             console.error("Error response status:", error.response.status);
             console.error("Error response headers:", error.response.headers);
             throw error;
        } else if (error.request) {
             console.error("Error request:", error.request);
             throw error;
        } else {
             console.error("Error message:", error.message);
             throw error;
        }
    }
}