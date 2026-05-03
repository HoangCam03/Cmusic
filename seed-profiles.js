const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/cmusic?authSource=admin';

async function seedUserProfiles() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const usersColl = db.collection('users');
    const tracksColl = db.collection('tracks');

    // Cập nhật ngẫu nhiên avatar, bio và follower cho MỌI user (đặc biệt là user admin của khách)
    await usersColl.updateMany(
      {},
      { 
        $set: { 
          bio: 'Một nghệ sĩ tài năng thuộc mạng lưới phân phối của CMusic. Người mang đến những giai điệu chữa lành và lan tỏa năng lượng tích cực đến mọi người.',
          followerCount: Math.floor(Math.random() * 500000) + 10000,
          monthlyListeners: Math.floor(Math.random() * 2000000) + 50000,
          avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop'
        }
      }
    );

    // Bổ sung thể loại cho các track cũ chưa có để Gợi ý tương tự (Recommended) hoạt động
    await tracksColl.updateMany(
      { genre: { $exists: false } },
      { $set: { genre: ["Pop", "Rap", "Acoustic"] } }
    );
     // Bổ sung thể loại cho các track có mảng genre rỗng
    await tracksColl.updateMany(
      { genre: { $size: 0 } },
      { $set: { genre: ["Pop", "Rap", "Acoustic"] } }
    );

    console.log('✅ Đã cập nhật hàng loạt Bio, Follower và Genre cho toàn hệ thống!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedUserProfiles();
