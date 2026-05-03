import mongoose, { Schema, Document } from 'mongoose';

export interface ITrack extends Document {
  title: string;
  artist: string; // Tên nghệ sĩ (Chuỗi văn bản hiển thị)
  artistId: mongoose.Types.ObjectId;
  officialArtistId?: mongoose.Types.ObjectId[]; // Chuyển thành mảng ID nghệ sĩ
  albumId?: mongoose.Types.ObjectId;
  duration: number; // In seconds
  audioUrl: string;
  coverUrl?: string;
  genre?: string[];
  playCount: number;
  lyrics?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    artist: { type: String, required: true, trim: true, index: true }, // Tên nghệ sĩ dạng text
    artistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // User sở hữu (người upload)
    officialArtistId: [{ type: Schema.Types.ObjectId, ref: 'Artist', index: true }], // Mảng các Artist Profile chính thức
    albumId: { type: Schema.Types.ObjectId, ref: 'Album' },
    duration: { type: Number, required: true },
    audioUrl: { type: String, required: true },
    coverUrl: { type: String },
    genre: [{ type: String }],
    playCount: { type: Number, default: 0 },
    lyrics: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Track = mongoose.model<ITrack>('Track', TrackSchema);
