import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },
  image: {
    type: String, // link hình ảnh playlist
    required: true,
  },
  desc: {
    type: String,
    default: "",
  },

  bgcolor: {
    type: String, // ví dụ: "#808080"
    default: "#ffffff",
  },

  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "song", // bài hát nổi bật
  },

  songs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "song",
    },
  ],

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },

  isPublic: {
    type: Boolean,
    default: true,
  },

  type: {
    type: String,
    enum: ['personal', 'system'], // personal: playlist cá nhân, system: playlist hệ thống
    default: 'personal',
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});


const playlistModel =
  mongoose.models.playlist || mongoose.model("playlist", playlistSchema);
export default playlistModel;
