export const updatePlaylist = async (playlistId, updatedData) => {
    try {
        const formData = new FormData();
        // Append text fields
        for (const key in updatedData) {
            if (key !== 'image' && key !== 'audio') {
                formData.append(key, updatedData[key]);
            }
        }

        // Append file fields if they exist
        if (updatedData.image) {
            formData.append('image', updatedData.image);
        }
        

        const response = await fetch(`${import.meta.env.VITE_API_URL}/playlist/update-playlist/${playlistId}`, {
            method: 'PUT',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle non-200 responses, e.g., backend errors
            const error = new Error(data.message || 'Failed to update playlist');
            error.status = response.status;
            throw error;
        }

        return data; // Return the successful response data

    } catch (error) {
        console.error("Error updating playlist:", error);
        // Rethrow or return a standardized error object
        throw error; // Rethrow to be handled by the calling component
    }
}