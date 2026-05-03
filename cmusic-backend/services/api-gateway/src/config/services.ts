import dotenv from 'dotenv';
dotenv.config();

export const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  USER: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  CATALOG: process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3003',
  PLAYLIST: process.env.PLAYLIST_SERVICE_URL || 'http://playlist-service:3004',
  LIKES: process.env.LIKES_SERVICE_URL || 'http://likes-service:3005',
  HISTORY: process.env.HISTORY_SERVICE_URL || 'http://history-service:3006',
  SEARCH: process.env.SEARCH_SERVICE_URL || 'http://search-service:3007',
  ADMIN: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3008',
  PERMISSION: process.env.PERMISSION_SERVICE_URL || 'http://permission-service:3009',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3010',
};
