import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  description?: string;
  thumbnail?: string;
  userId: mongoose.Types.ObjectId;
  tracks: mongoose.Types.ObjectId[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  thumbnail: { type: String, default: "https://res.cloudinary.com/dmsh987un/image/upload/v1715140000/cmusic/defaults/playlist-default.png" },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tracks: [{ type: Schema.Types.ObjectId, ref: 'Track' }],
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

export const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
