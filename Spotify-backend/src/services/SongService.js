import Song from "../models/songModel.js";
import Playlist from "../models/playlistModel.js";

const createSong = (newSong) => {
  return new Promise(async (resolve, reject) => {
    const { name, artist, desc, playlist, album, duration, file, image } = newSong;
    try {
      const existingSong = await Song.findOne({ name, artist, playlist });
      if (existingSong !== null) {
        resolve({
          status: "error",
          message: "Song already exists",
        });
        return;
      }
      const createdSong = await Song.create({
        name,
        artist,
        desc,
        playlist,
        album,
        duration,
        file,
        image,
      });
      await Playlist.findByIdAndUpdate(playlist, {
        $push: { songs: createdSong._id },
      });
      resolve({
        status: "success",
        message: "Song created successfully",
        data: createdSong,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const listSongs = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const songs = await Song.find();
      resolve({
        status: "Success",
        message: "Songs fetched successfully",
        data: songs,
      });
    } catch (error) {
      reject(error);
    }
  });
};

const deleteSong = (songId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkSong = await Song.findOne({ _id: songId });

      console.log("checkSong: ", checkSong);

      if (checkSong === null) {
        resolve({
          status: "ERROR",
          message: "The Song is not defined",
        });
        return; 
      }

      console.log("Song ID:", checkSong._id);

      // Xoá bài hát
      await Song.findByIdAndDelete(songId);

      // Cập nhật playlist
      if (checkSong.playlist) {
        await Playlist.findByIdAndUpdate(checkSong.playlist, {
          $pull: { songs: checkSong._id },
        });
      }
      resolve({
        status: "Success",
        message: "Song deleted successfully",
      });
    } catch (error) {
      console.error("Delete song failed", error.message);
      reject(error);
    }
  });
};

// New function to update a song
const updateSong = async (songId, updatedFields) => {
  try {
    const song = await Song.findByIdAndUpdate(songId, updatedFields, { new: true });
    return song;
  } catch (error) {
    console.error("Update song failed", error.message);
    throw error;
  }
};

export default { createSong, listSongs, deleteSong, updateSong };
