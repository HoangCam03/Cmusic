export const deleteSong = async (SongId) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/song/delete-song/${SongId}`, {
        method: "DELETE",
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Error deleting album:", error);
        return { status: "error" };
    }
}
