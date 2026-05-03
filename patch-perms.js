const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/cmusic?authSource=admin';

async function patch() {
  try {
    console.log(' Đang kết nối Database...');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const permissionsCollection = db.collection('permissions');

    const missingPerms = [
      { id: 'view_dashboard', label: 'Xem trang Dashboard', description: 'Cho phép truy cập tổng quan', category: 'admin', guard: 'private', roles: { admin: true, artist: false, user: false }, order: 6, createdAt: new Date(), updatedAt: new Date() },
      { id: 'manage_permissions', label: 'Quản lý Quyền', description: 'Cấu hình quyền hệ thống', category: 'system', guard: 'private', roles: { admin: true, artist: false, user: false }, order: 7, createdAt: new Date(), updatedAt: new Date() }
    ];

    await permissionsCollection.insertMany(missingPerms);
    console.log('✅ Đã cấp thêm chìa khóa view_dashboard và manage_permissions thành công!');

    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    process.exit(1);
  }
}

patch();
