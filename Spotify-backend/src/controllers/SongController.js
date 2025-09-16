import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import SongService from "../services/SongService.js";


const addSong = async (req, res) => {
  try {
    console.log("request body", req.body);
    console.log("files", req.files);
    const { name, artist, desc, playlist, album } = req.body;
    const audioFile = req.files.audio?.[0];
    const imageFile = req.files.image?.[0];
    
    if (!name || !artist || !desc || !playlist || !album) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (!audioFile || !imageFile) {
      return res.status(400).json({ error: "Missing audio or image file" });
    }
    
    const audioUpload = await cloudinary.uploader.upload(audioFile.path, {
      resource_type: "video"
    });
    
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image"
    });
    const duration = `${Math.floor(audioUpload.duration / 60)}:${audioUpload.duration % 60}`;
    
    console.log(name, desc, playlist, album, audioUpload, imageUpload);

    //Gọi service lưu vào DB
    const newSong = await SongService.createSong({
      name,
      artist,
      desc,
      playlist: new mongoose.Types.ObjectId(playlist),
      album,
      duration,
      file: audioUpload.secure_url,
      image: imageUpload.secure_url
    });
  

    res.status(201).json({
      message: "Upload & save successful",
      song: newSong,
    });
  } catch (error) {
    console.error("Upload failed", error.message);
    const message =
      error.message === "Song already exists"
        ? error.message
        : "Upload failed";
    const statusCode = error.message === "Song already exists" ? 400 : 500;

    res.status(statusCode).json({ error: message });
  }
};

const listSong = async (req, res) => {
  try {
    const songs = await SongService.listSongs();
    res.status(200).json(songs);
  } catch (error) {
    console.error("List songs failed", error.message);
    res.status(500).json({ error: "List songs failed" });
  }
};

const deleteSong = async (req, res) => {
  try {
    const songId = req.params._id;
    const deletedSong = await SongService.deleteSong(songId);
    if (deletedSong) {
      res.status(200).json({ status: "Success", message: "Song deleted successfully" });
    } else {
      res.status(404).json({ error: "Song not found" });
    }
  } catch (error) {
    console.error("Delete song failed", error.message);
    res.status(500).json({ error: "Delete song failed" });
  }
}

// New function to edit a song
const editSong = async (req, res) => {
  try {
    const songId = req.params._id; // Get song ID from URL params
    const { name, artist, desc, playlist, album } = req.body;
    const audioFile = req.files?.audio?.[0];
    const imageFile = req.files?.image?.[0];

    let updatedFields = {
      name,
      artist,
      desc,
      playlist: new mongoose.Types.ObjectId(playlist),
      album,
    };

    // Handle new file uploads if provided
    if (audioFile) {
      const audioUpload = await cloudinary.uploader.upload(audioFile.path, {
        resource_type: "video"
      });
      updatedFields.file = audioUpload.secure_url;
      updatedFields.duration = `${Math.floor(audioUpload.duration / 60)}:${audioUpload.duration % 60}`;
    }

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image"
      });
      updatedFields.image = imageUpload.secure_url;
    }

    // Call service to update the song
    const updatedSong = await SongService.updateSong(songId, updatedFields);

    if (updatedSong) {
      res.status(200).json({
        message: "Song updated successfully",
        song: updatedSong,
      });
    } else {
      res.status(404).json({ error: "Song not found" });
    }

  } catch (error) {
    console.error("Edit song failed", error.message);
    res.status(500).json({ error: "Edit song failed" });
  }
};


export default {addSong, listSong, deleteSong, editSong};