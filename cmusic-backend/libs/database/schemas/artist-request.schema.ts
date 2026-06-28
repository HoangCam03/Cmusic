import mongoose, { Schema, Document } from 'mongoose';

export interface IArtistRequest extends Document {
  userId: mongoose.Types.ObjectId;
  stageName: string;
  bio?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    soundcloud?: string;
    youtube?: string;
  };
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ArtistRequestSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stageName: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      soundcloud: { type: String, trim: true },
      youtube: { type: String, trim: true },
    },
    reason: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

export const ArtistRequest = mongoose.models['ArtistRequest'] || mongoose.model<IArtistRequest>('ArtistRequest', ArtistRequestSchema);
