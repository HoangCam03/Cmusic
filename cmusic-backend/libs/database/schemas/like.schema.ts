import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
  userId: mongoose.Types.ObjectId;
  trackId: mongoose.Types.ObjectId;
}

const LikeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trackId: { type: Schema.Types.ObjectId, ref: 'Track', required: true, index: true },
  },
  { timestamps: true }
);

// Tránh duplicate like
LikeSchema.index({ userId: 1, trackId: 1 }, { unique: true });

export const Like = mongoose.model<ILike>('Like', LikeSchema);
