import mongoose from 'mongoose';
// import bcrypt from 'bcrypt'; // Cần cài đặt và uncomment nếu dùng mã hóa mật khẩu ở đây

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    // required: true, // Đảm bảo username là duy nhất
    trim: true,
    sparse: true // Cho phép nhiều document không có username
  },
  email: {
    type: String,
    required: true,
    unique: true, // Đảm bảo email là duy nhất
    trim: true,
    lowercase: true, // Lưu email dưới dạng chữ thường
    // Thêm validation format email nếu cần (vd: match: /regex/)
  },
  password: {
    type: String,
    required: true,
    select: false, // Không trả về trường password khi thực hiện query mặc định
  },
  profilePictureUrl: {
    type: String,
    default: '', // URL ảnh đại diện mặc định
  },
  country: {
    type: String,
    // required: true, 
  },
  language: {
    type: String,
    default: 'en', 
  },
  subscriptionType: {
    type: String,
    enum: ['free', 'premium', 'family', 'trial'], 
    default: 'free',
  },
  refreshToken: {
    type: String,
  },
  role: { // <-- Thêm trường role
    type: String,
    enum: ['user', 'admin'], // Các vai trò có thể có
    default: 'user', // Vai trò mặc định khi đăng ký mới là 'user'
  },

  likedSongs: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song', 
  }],
  followedArtists: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist', 
  }],
  followedUsers: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdPlaylists: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist', // Giả sử bạn có Playlist model
  }],
  savedAlbums: [{ // Mảng các ID album đã lưu
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album', // Giả sử bạn có Album model
  }],
  savedPodcasts: [{ // Mảng các ID podcast đã lưu
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Podcast', // Giả sử bạn có Podcast model
  }],
  recentlyPlayed: [{ // Lịch sử nghe gần đây (cần cân nhắc cấu trúc chi tiết hơn)
    type: mongoose.Schema.Types.ObjectId,
    // Có thể tham chiếu đến Song, Album, Podcast... hoặc lưu object chi tiết hơn
  }],


  // New fields from registration steps
  dateOfBirth: {
    day: {
      type: String,
      required: true
    },
    month: {
      type: String,
      required: true
    },
    year: {
      type: String,
      required: true
    }
  },
  gender: {
    type: String,
    enum: ['man', 'woman', 'non-binary', 'something-else', 'prefer-not-to-say'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });



// --- Middleware để mã hóa mật khẩu trước khi lưu ---
// userSchema.pre('save', async function(next) {
//   // Chỉ hash nếu trường password bị thay đổi (khi tạo user hoặc update password)
//   if (!this.isModified('password')) return next();
//   try {
//     const salt = await bcrypt.genSalt(10); // Tạo salt với 10 vòng
//     this.password = await bcrypt.hash(this.password, salt); // Mã hóa mật khẩu
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// --- Method để so sánh mật khẩu ---
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   // 'this' ở đây là document user cụ thể
//   return await bcrypt.compare(candidatePassword, this.password);
// };
// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();    
  next();
});



const User = mongoose.model('User', userSchema);

export default User;
