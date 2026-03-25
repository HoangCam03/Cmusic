import dotenv from 'dotenv';
dotenv.config();

export const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  USER: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  CATALOG: process.env.CATALOG_SERVICE_URL || 'http://localhost:3003',
  PLAYLIST: process.env.PLAYLIST_SERVICE_URL || 'http://localhost:3004',
  LIKES: process.env.LIKES_SERVICE_URL || 'http://localhost:3005',
  HISTORY: process.env.HISTORY_SERVICE_URL || 'http://localhost:3006',
  SEARCH: process.env.SEARCH_SERVICE_URL || 'http://localhost:3007',
  ADMIN: process.env.ADMIN_SERVICE_URL || 'http://localhost:3008',
};
