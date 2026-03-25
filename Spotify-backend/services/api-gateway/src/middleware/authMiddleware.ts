import { Request, Response, NextFunction } from "express";
import { AuthError, ForbiddenError } from "@libs/errors.js";
import { verifyAccessToken, TokenPayload } from "@libs/utils/jwt.helper.js";

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware xác thực Access Token từ Header Authorization
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AuthError("Token không tìm thấy hoặc định dạng không đúng"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    
    // Thêm userId vào header để các service phía sau có thể nhận biết
    req.headers["x-user-id"] = decoded.userId;
    req.headers["x-user-role"] = decoded.role;
    
    next();
  } catch (err) {
    return next(new AuthError("Token không hợp lệ hoặc đã hết hạn"));
  }
};

/**
 * Middleware phân quyền (Role-based Access Control)
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError("Người dùng chưa được xác thực"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Bạn không có quyền truy cập tài nguyên này"));
    }

    next();
  };
};
