import jwt from 'jsonwebtoken';
// import User from '../models/UserModel.js'; // Có thể cần import nếu muốn kiểm tra user tồn tại trong DB mỗi lần request (tùy chọn)

const JWT_SECRET = process.env.JWT_SECRET || 'INSECURE_DEFAULT_JWT_SECRET_CHANGE_ME'; // Lấy secret từ env

// Middleware để xác thực Access Token
export const authenticateToken = (req, res, next) => {
  // Lấy token từ header Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Lấy phần token sau 'Bearer '

  if (token == null) {
    // Nếu không có token, trả về lỗi 401 Unauthorized
    return res.status(401).json({ status: 'Error', message: 'Authentication token required' });
  }

  // Xác minh token
  jwt.verify(token, JWT_SECRET, async (err, userPayload) => {
    if (err) {
      // Nếu token không hợp lệ (sai secret, hết hạn, v.v.), trả về lỗi 403 Forbidden
      return res.status(403).json({ status: 'Error', message: 'Invalid or expired token' });
    }

    // Token hợp lệ. userPayload chứa payload từ token (id, role)

    // Tùy chọn: Kiểm tra xem user có tồn tại trong DB không (để phát hiện user bị xóa sau khi cấp token)
    // const user = await User.findById(userPayload.id);
    // if (!user) {
    //    return res.status(404).json({ status: 'Error', message: 'User not found' });
    // }

    // Gắn thông tin user (từ payload token) vào request object
    req.user = userPayload; // req.user sẽ có { id: userId, role: userRole }

    // Cho phép request đi tiếp đến handler tiếp theo
    next();
  });
};

// Middleware để kiểm tra quyền Admin
export const authorizeAdmin = (req, res, next) => {
  // authenticateToken middleware phải chạy trước middleware này để req.user có thông tin user
  if (!req.user || req.user.role !== 'admin') {
    // Nếu user chưa xác thực hoặc không phải admin, trả về lỗi 403 Forbidden
    return res.status(403).json({ status: 'Error', message: 'Admin access required' });
  }

  // Nếu user là admin, cho phép request đi tiếp
  next();
};

// Có thể thêm các middleware phân quyền khác (ví dụ: authorizeUser, authorizeOwner, v.v.)
