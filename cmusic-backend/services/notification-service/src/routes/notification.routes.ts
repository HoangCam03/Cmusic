import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

// Lấy danh sách thông báo
router.get('/', notificationController.getNotifications);

// Đánh dấu tất cả là đã đọc
router.patch('/read-all', notificationController.markAllAsRead);

// Đánh dấu một thông báo là đã đọc
router.patch('/:id/read', notificationController.markAsRead);

// Tạo thông báo mới (POST)
router.post('/', notificationController.createNotification);

export default router;
