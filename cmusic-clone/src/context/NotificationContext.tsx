import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../services/api';

interface Notification {
  _id: string;
  type: 'FOLLOW' | 'COMMENT_TAG' | 'REPLY' | 'NEW_RELEASE' | 'SYSTEM';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  senderId?: {
    _id: string;
    displayName: string;
    avatarUrl: string;
  };
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      // Luôn kiểm tra token trước khi gọi API để tránh trigger refresh token loop
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err: any) {
      // Hoàn toàn im lặng với lỗi xác thực ở background task này
      if (err?.response?.status === 401 || err?.response?.status === 404) {
        return;
      }
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // Nếu không có token hoặc user, xóa danh sách thông báo và thoát
    if (!userStr || !token) {
      setNotifications([]);
      return;
    }

    const user = JSON.parse(userStr);
    fetchNotifications();

    // Kết nối Socket.io trực tiếp tới Notification Service (port 3010)
    // Trong môi trường Docker, cần dùng biến VITE_NOTIFICATION_URL
    const NOTIFICATION_URL = import.meta.env.VITE_NOTIFICATION_URL || 'http://localhost:3010';
    const newSocket = io(NOTIFICATION_URL, {
      query: { userId: user.id || user._id },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    newSocket.on('connect', () => {
      console.log('[Notification Socket]: Connected');
    });

    newSocket.on('connect_error', () => {
      // Silent fail - thông báo realtime chưa hoạt động nhưng không crash app
    });

    newSocket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast.success(notification.message, {
        icon: '🔔',
        duration: 5000
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [localStorage.getItem('token')]); // Tự động kết nối lại khi token thay đổi (đăng nhập)

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
