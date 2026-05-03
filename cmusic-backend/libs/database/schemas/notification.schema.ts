import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId; // User who receives the notification
  senderId?: mongoose.Types.ObjectId;    // User who triggered the notification (optional)
  type: 'FOLLOW' | 'COMMENT_TAG' | 'REPLY' | 'NEW_RELEASE' | 'SYSTEM';
  title: string;
  message: string;
  link?: string; // Deep link to the track/artist/profile
  isRead: boolean;
  data?: any; // Additional data (e.g. trackId, artistId)
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { 
      type: String, 
      enum: ['FOLLOW', 'COMMENT_TAG', 'REPLY', 'NEW_RELEASE', 'SYSTEM'], 
      required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
