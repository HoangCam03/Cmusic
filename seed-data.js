const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb://mongodb:27017/cmusic';

async function seed() {
  try {
    console.log('Đang kết nối Database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối MongoDB!');

    const db = mongoose.connection.db;

    // 1. Tạo Permissions chuẩn xác theo schema
    const permissionsCollection = db.collection('permissions');
    const perms = [
      {
        id: 'upload_track',
        label: 'Tải nhạc lên',
        description: 'Cho phép tải bài hát mới lên hệ thống',
        category: 'content',
        guard: 'public',
        roles: { admin: true, artist: true, user: false },
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'edit_own_track',
        label: 'Sửa bài hát cá nhân',
        description: 'Sửa bài hát do mình tải lên',
        category: 'content',
        guard: 'public',
        roles: { admin: true, artist: true, user: false },
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'delete_any_track',
        label: 'Xóa mọi bài hát',
        description: 'Quyền xóa bất kỳ bài hát nào',
        category: 'admin',
        guard: 'private',
        roles: { admin: true, artist: false, user: false },
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await permissionsCollection.deleteMany({});
    await permissionsCollection.insertMany(perms);
    console.log(' Đã nạp lại bảng quyền (Permissions) theo đúng Schema!');

    // 2. Tạo User Admin chuẩn xác theo schema
    const usersCollection = db.collection('users');
    const adminEmail = 'admin@cmusic.com';
    
    // Kiểm tra xem admin đã có chưa
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = {
        email: adminEmail,
        password: hashedPassword,
        displayName: 'Quản Trị Viên',
        avatarUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        role: 'admin',
        authProvider: 'local',
        isEmailVerified: true,
        plan: 'premium',
        preferences: {
          language: 'vi',
          theme: 'dark',
          emailNotifications: true
        },
        country: 'VN',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(adminUser);
      console.log(' Đã nạp lại Quản trị viên! (admin@cmusic.com / admin123)');
    } else {
      console.log(' Quản trị viên đã tồn tại, bỏ qua bước tạo...');
    }

    console.log('\n--- XONG! Dữ liệu gốc đã được khôi phục ---');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi khôi phục dữ liệu:', error);
    process.exit(1);
  }
}

seed();
