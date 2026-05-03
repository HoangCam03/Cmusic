const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/cmusic?authSource=admin';

async function seed() {
  try {
    console.log('Đang kết nối Database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối MongoDB!');

    const db = mongoose.connection.db;

    // --- 1. NẠP PERMISSIONS ---
    const permissionsCollection = db.collection('permissions');
    const perms = [
      { id: 'upload_track', label: 'Tải nhạc lên', description: 'Cho phép tải bài hát mới', category: 'content', guard: 'public', roles: { admin: true, artist: true, user: false }, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 'edit_own_track', label: 'Sửa bài hát cá nhân', description: 'Sửa bài hát do mình tải lên', category: 'content', guard: 'public', roles: { admin: true, artist: true, user: false }, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 'delete_any_track', label: 'Xóa mọi bài hát', description: 'Quyền xóa bất kỳ bài hát nào', category: 'admin', guard: 'private', roles: { admin: true, artist: false, user: false }, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: 'manage_users', label: 'Quản lý người dùng', description: 'Khóa / Mở khóa người dùng', category: 'users', guard: 'private', roles: { admin: true, artist: false, user: false }, order: 4, createdAt: new Date(), updatedAt: new Date() },
      { id: 'approve_payment', label: 'Duyệt thanh toán', description: 'Duyệt hóa đơn thủ công', category: 'system', guard: 'private', roles: { admin: true, artist: false, user: false }, order: 5, createdAt: new Date(), updatedAt: new Date() }
    ];
    await permissionsCollection.deleteMany({});
    await permissionsCollection.insertMany(perms);
    console.log('✅ Đã nạp xong: Phân Quyền (Permissions)');

    // --- 2. NẠP PLAN FEATURES ---
    const planFeaturesCollection = db.collection('planfeatures');
    const planFeatures = [
      { id: 'audio_quality', label: 'Chất lượng âm thanh', category: 'Streaming', limits: { free: '128kbps', student: '320kbps', premium: '320kbps', family: '320kbps' }, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 'offline_mode', label: 'Nghe ngoại tuyến', category: 'Streaming', limits: { free: '❌ Không hỗ trợ', student: '✅ Tải 500 bài', premium: '✅ Không giới hạn', family: '✅ Không giới hạn' }, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ad_free', label: 'Trải nghiệm quảng cáo', category: 'Trải nghiệm', limits: { free: '❌ Có chèn quảng cáo', student: '✅ Không quảng cáo', premium: '✅ Không quảng cáo', family: '✅ Không quảng cáo' }, order: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: 'lyrics_sync', label: 'Lời bài hát đồng bộ', category: 'Tính năng', limits: { free: '❌ Không', student: '✅ Có hỗ trợ', premium: '✅ Có hỗ trợ', family: '✅ Có hỗ trợ' }, order: 4, createdAt: new Date(), updatedAt: new Date() }
    ];
    await planFeaturesCollection.deleteMany({});
    await planFeaturesCollection.insertMany(planFeatures);
    console.log('✅ Đã nạp xong: Tính năng gói cước (Plan Features)');

    // --- 3. NẠP ADMIN USER ---
    const usersCollection = db.collection('users');
    const adminEmail = 'admin@cmusic.com';
    await usersCollection.deleteMany({ email: adminEmail });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const adminOid = new mongoose.Types.ObjectId();
    
    const adminUser = {
      _id: adminOid,
      email: adminEmail,
      password: hashedPassword,
      displayName: 'Admin CMusic',
      avatarUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      role: 'admin',
      authProvider: 'local',
      isEmailVerified: true,
      plan: 'premium',
      preferences: { language: 'vi', theme: 'dark', emailNotifications: true },
      country: 'VN',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await usersCollection.insertOne(adminUser);
    console.log('✅ Đã nạp xong: Admin User (email: admin@cmusic.com | pass: admin123)');

    console.log('\n🎉 HOÀN TẤT NẠP DỮ LIỆU ĐỒ ÁN MẪU! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi khôi phục dữ liệu:', error);
    process.exit(1);
  }
}

seed();
