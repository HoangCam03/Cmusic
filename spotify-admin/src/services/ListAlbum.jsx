export const getAllAlbums = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/album/list-albums`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching albums:", error);
    return { status: "error", albums: [] };
  }
};
