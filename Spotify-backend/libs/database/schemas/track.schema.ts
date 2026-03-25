import mongoose, { Schema, Document } from 'mongoose';

export interface ITrack extends Document {
  title: string;
  artistId: mongoose.Types.ObjectId;
  albumId?: mongoose.Types.ObjectId;
  duration: number; // In seconds
  audioUrl: string;
  coverUrl?: string;
  genre?: string[];
  playCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    artistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    albumId: { type: Schema.Types.ObjectId, ref: 'Album' },
    duration: { type: Number, required: true },
    audioUrl: { type: String, required: true },
    coverUrl: { type: String },
    genre: [{ type: String }],
    playCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Track = mongoose.model<ITrack>('Track', TrackSchema);
