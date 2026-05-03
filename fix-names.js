const mongoose = require('mongoose');

async function fixNames() {
  try {
    await mongoose.connect('mongodb://admin:admin123@localhost:27017/cmusic?authSource=admin');
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateMany(
      { displayName: { $regex: /admin/i } },
      { $set: { displayName: 'Nghệ sĩ CMusic' } }
    );
    console.log(`✅ Đã cập nhật ${result.modifiedCount} tài khoản.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixNames();
