import jwt from 'jsonwebtoken';

// Sử dụng biến môi trường cho khóa bí mật (trong thực tế)
// Cái giá trị sau || chỉ là fallback, không phải secret thật trong production
const JWT_SECRET = process.env.JWT_SECRET || 'INSECURE_DEFAULT_JWT_SECRET_CHANGE_ME';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'INSECURE_DEFAULT_REFRESH_SECRET_CHANGE_ME';

// Kiểm tra xem các biến môi trường quan trọng đã được thiết lập chưa
if (JWT_SECRET === 'INSECURE_DEFAULT_JWT_SECRET_CHANGE_ME') {
  console.warn("WARNING: JWT_SECRET environment variable is not set. Using insecure default.");
}
if (REFRESH_TOKEN_SECRET === 'INSECURE_DEFAULT_REFRESH_SECRET_CHANGE_ME') {
  console.warn("WARNING: REFRESH_TOKEN_SECRET environment variable is not set. Using insecure default.");
}

// Hàm để sinh cặp token (nhận user object hoặc { id, role })
export const generateTokens = (user) => {
  // Đảm bảo user object có _id và role
  if (!user || !user._id || !user.role) {
    throw new Error("User object with _id and role is required to generate tokens");
  }

  // Bao gồm user ID và role trong Access Token payload
  const accessToken = jwt.sign(
    { id: user._id, role: user.role }, // <-- Thêm role vào payload
    JWT_SECRET,
    { expiresIn: '2h' } 
  );

  // Refresh Token thường chỉ cần user ID
  const refreshToken = jwt.sign(
    { id: user._id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // Thời gian sống dài
  );

  return { accessToken, refreshToken };
};


