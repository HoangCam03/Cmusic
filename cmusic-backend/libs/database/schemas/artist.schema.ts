import mongoose, { Schema, Document } from 'mongoose';

export interface IArtist extends Document {
  name: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  gallery?: string[];
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  stats?: {
    monthlyListeners: number;
    followerCount: number;
    topCities: { city: string; count: number }[];
  };
  isVerified: boolean;
  userId?: mongoose.Types.ObjectId; // Liên kết với tài khoản người dùng nếu có
  createdAt: Date;
  updatedAt: Date;
}

const ArtistSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    avatarUrl: { type: String, required: true },
    bannerUrl: { type: String },
    bio: { type: String },
    gallery: [{ type: String }],
    socials: {
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String },
      youtube: { type: String },
    },
    stats: {
      monthlyListeners: { type: Number, default: 0 },
      followerCount: { type: Number, default: 0 },
      topCities: [
        {
          city: { type: String },
          count: { type: Number },
        },
      ],
    },
    isVerified: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Artist = mongoose.model<IArtist>('Artist', ArtistSchema);
