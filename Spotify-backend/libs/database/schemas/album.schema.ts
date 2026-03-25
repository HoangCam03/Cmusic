import mongoose, { Schema, Document } from 'mongoose';

export interface IAlbum extends Document {
  title: string;
  artistId: mongoose.Types.ObjectId;
  coverUrl?: string;
  releaseDate?: Date;
  genre?: string[];
  trackIds: mongoose.Types.ObjectId[];
  isSingle: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlbumSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    artistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coverUrl: { type: String },
    releaseDate: { type: Date, default: Date.now },
    genre: [{ type: String }],
    trackIds: [{ type: Schema.Types.ObjectId, ref: 'Track' }],
    isSingle: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Album = mongoose.model<IAlbum>('Album', AlbumSchema);
