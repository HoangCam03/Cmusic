const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/cmusic?authSource=admin';

async function seed() {
  try {
    console.log('🚀 Đang kết nối Database để nạp nội dung chi tiết...');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const tracksCollection = db.collection('tracks');

    // 1. Cập nhật Bio cho Admin (đóng vai Nghệ sĩ mẫu)
    await usersCollection.updateOne(
      { email: 'admin@cmusic.com' },
      { 
        $set: { 
          displayName: 'Admin CMusic',
          bio: 'Nghệ sĩ đa tài với những bản phối độc quyền chỉ có tại CMusic. Hành trình âm nhạc bắt đầu từ niềm đam mê vô tận với âm thanh.',
          followerCount: 25400,
          monthlyListeners: 120500
        } 
      }
    );

    const adminUser = await usersCollection.findOne({ email: 'admin@cmusic.com' });
    const uOid = adminUser._id;

    // 2. Cập nhật lời bài hát và nội dung chi tiết cho các tracks
    const sampleLyrics = `[00:00.00]Giai điệu bắt đầu...
[00:15.00]Tôi vẫn nhớ những ngày mưa rơi
[00:20.00]Từng giọt nước đọng lại trên môi
[00:25.00]Âm nhạc là thứ duy nhất vỗ về
[00:30.00]Đưa tôi về lại những ngày xưa cũ
[00:45.00]Nhưng giờ đây mọi thứ đã đổi thay
[00:50.00]Cùng CMusic tận hưởng phút giây này...`;

    await tracksCollection.updateMany(
      { artistId: uOid },
      { 
        $set: { 
          lyrics: sampleLyrics,
          genre: ['Pop', 'Chill', 'V-Pop']
        } 
      }
    );

    console.log('✅ Đã nạp xong: Lời bài hát & Bio nghệ sĩ XỊN SÒ!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi nạp dữ liệu chi tiết:', error);
    process.exit(1);
  }
}

seed();
