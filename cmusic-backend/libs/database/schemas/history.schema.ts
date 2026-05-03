import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  userId: mongoose.Types.ObjectId;
  trackId: mongoose.Types.ObjectId;
  playedAt: Date;
}

const HistorySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trackId: { type: Schema.Types.ObjectId, ref: 'Track', required: true, index: true },
    playedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// TTL index to automatically remove history older than 90 days if needed
// HistorySchema.index({ playedAt: 1 }, { expireAfterSeconds: 7776000 });

export const History = mongoose.model<IHistory>('History', HistorySchema);
