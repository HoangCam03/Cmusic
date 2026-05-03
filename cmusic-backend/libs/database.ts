import mongoose from 'mongoose';

export { mongoose };

// Export all schemas here for easier access
export * from './database/schemas/user.schema';
export * from './database/schemas/track.schema';
export * from './database/schemas/artist.schema';
export * from './database/schemas/album.schema';
export * from './database/schemas/playlist.schema';
export * from './database/schemas/comment.schema';
export * from './database/schemas/history.schema';
export * from './database/schemas/like.schema';
export * from './database/schemas/follow.schema';
export * from './database/schemas/permission.schema';
export * from './database/schemas/plan-feature.schema';
export * from './database/schemas/notification.schema';
