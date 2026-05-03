import { Request, Response, NextFunction } from "express";
import { AuthError, ForbiddenError } from "@spotify/libs/errors";
import { verifyAccessToken, TokenPayload } from "@spotify/libs/utils/jwt.helper";
import axios from "axios";
import { SERVICES } from "../config/services";

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware xác thực Access Token từ Header Authorization
 */
export const authenticate = async (
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

    // Fetch permissions to pass down
    try {
      if (Date.now() - lastCacheTime > CACHE_TTL || permissionsCache.length === 0) {
        const response = await axios.get(`${SERVICES.PERMISSION}/permissions`);
        if (response.data && response.data.success) {
          permissionsCache = response.data.data;
          lastCacheTime = Date.now();
        }
      }
      
      const userPermissions = permissionsCache
        .filter(p => p.roles[decoded.role] === true)
        .map(p => p.id);
      
      req.headers["x-user-permissions"] = userPermissions.join(',');
    } catch (e) {
      console.error("Failed to inject permissions to header");
    }
    
    next();
  } catch (err) {
    return next(new AuthError("Token không hợp lệ hoặc đã hết hạn"));
  }
};

/**
 * Middleware phân quyền (Role-based Access Control) - CŨ (Chỉ check mảng fix cứng)
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

/**
 * Cache dữ liệu phân quyền
 */
let permissionsCache: any[] = [];
let lastCacheTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Middleware phân quyền ĐỘNG (Dựa trên Database Permission Matrix)
 */
export const requirePermission = (permissionId: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError("Người dùng chưa được xác thực"));
    }

    try {
      // 1. Fetch hoặc dùng Cache
      if (Date.now() - lastCacheTime > CACHE_TTL || permissionsCache.length === 0) {
        // Internal call to directly fetch from the permission service inside the network
        const permUrl = SERVICES.PERMISSION.replace("http://", "http://"); 
        const response = await axios.get(`${SERVICES.PERMISSION}/permissions`);
        if (response.data && response.data.success) {
          permissionsCache = response.data.data;
          lastCacheTime = Date.now();
        }
      }

      // 2. Tìm quyền yêu cầu
      const permConfig = permissionsCache.find(p => p.id === permissionId);

      // Nếu không tìm thấy quyền trong CSDL, mặc định từ chối (bảo mật tối đa)
      if (!permConfig) {
        console.warn(`[Gateway Warning]: Missing permission constraint for ID: ${permissionId}`);
        return next(new ForbiddenError("Bạn không có quyền truy cập (Unknown constraint)"));
      }

      // 3. Kiểm tra User Role có được cấp lá cờ `true` trong matrix không
      const userRole = req.user.role; // e.g., 'admin', 'artist', 'user'
      const hasAccess = permConfig.roles[userRole] === true;

      if (!hasAccess) {
        return next(new ForbiddenError("Bạn không có quyền thực hiện hành động này"));
      }

      next();
    } catch (error: any) {
      console.error("[Gateway Error]: Failed to check dynamic permissions:", error.message);
      // Fallback: Nếu service phân quyền chết, chỉ cho phép admin
      if (req.user.role === 'admin') {
        return next();
      }
      return next(new ForbiddenError("Hệ thống phân quyền tạm thời gián đoạn"));
    }
  };
};
