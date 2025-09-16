export const deleteAlbum = async (albumId) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/album/delete-album/${albumId}`, {
        method: "DELETE",
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Error deleting album:", error);
        return { status: "error" };
    }
}
