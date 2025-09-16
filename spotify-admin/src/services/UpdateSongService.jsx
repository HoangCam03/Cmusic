export const updateSong = async (songId, updatedData) => {
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
        if (updatedData.audio) {
            formData.append('audio', updatedData.audio);
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/song/update-song/${songId}`, {
            method: 'PUT',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle non-200 responses, e.g., backend errors
            const error = new Error(data.message || 'Failed to update song');
            error.status = response.status;
            throw error;
        }

        return data; // Return the successful response data

    } catch (error) {
        console.error("Error updating song:", error);
        // Rethrow or return a standardized error object
        throw error; // Rethrow to be handled by the calling component
    }
}