import { Request, Response, NextFunction } from 'express';
import { NotificationModel } from '../server';

class NotificationController {
  // 1. Lấy danh sách thông báo của người dùng
  public async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      console.log(`[Notification Service] Fetching notifications for user: ${userId}`);
      
      const notifications = await NotificationModel.find({ recipientId: userId })
        .populate('senderId', 'displayName avatarUrl')
        .sort({ createdAt: -1 })
        .limit(50);

      return res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  // 2. Đánh dấu một thông báo là đã đọc
  public async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notification = await NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
      return res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  // 3. Đánh dấu tất cả là đã đọc
  public async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'];
      await NotificationModel.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
      return res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
    } catch (error) {
      next(error);
    }
  }

  // 4. Tạo thông báo mới (Được gọi từ catalog-service qua HTTP nội bộ)
  public async createNotification(req: any, res: Response, next: NextFunction) {
    try {
      const { recipientId, type, title, message, link, data, senderId } = req.body;

      if (!recipientId || !type || !title || !message) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
      }

      const notification = new NotificationModel({
        recipientId,
        senderId,
        type,
        title,
        message,
        link,
        data
      });

      await notification.save();
      
      // Quan trọng: Populate thông tin người gửi trước khi gửi qua Socket
      const populatedNotification = await NotificationModel.findById(notification._id)
        .populate('senderId', 'displayName avatarUrl');

      console.log(`[Notification Service] Created ${type} notification for user ${recipientId}`);

      // Gửi realtime qua Socket.io tới đúng user
      if (req.io && populatedNotification) {
        req.io.to(recipientId.toString()).emit('notification', populatedNotification);
        console.log(`[Socket] Emitted populated notification to room: ${recipientId}`);
      }

      return res.status(201).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
