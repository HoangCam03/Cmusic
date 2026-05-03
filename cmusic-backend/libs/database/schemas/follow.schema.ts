import mongoose, { Schema, Document } from 'mongoose';

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId; // User who follows
  followingId: mongoose.Types.ObjectId; // Artist who is being followed
  createdAt: Date;
}

const FollowSchema: Schema = new Schema(
  {
    followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    followingId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Đảm bảo một user chỉ follow một nghệ sĩ một lần
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const Follow = mongoose.model<IFollow>('Follow', FollowSchema);
