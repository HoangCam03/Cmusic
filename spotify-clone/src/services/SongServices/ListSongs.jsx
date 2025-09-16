
export const getAllSongs = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/song/list-songs`);
    const data = await res.json();

    if (data?.status === "Success" && data?.data?.length > 0) {
      return data.data; // Trả về mảng bài hát
    } else {
      return []; // Trả về mảng rỗng nếu không có bài hát
    }
  } catch (error) {
    console.error("Failed to fetch songs:", error);
    return [];
  }
};
