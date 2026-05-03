import { verifyAccessToken } from '../utils/jwt.helper';
import { AuthError } from '../errors';

/**
 * Middleware xác thực JWT — dùng `any` để tránh type conflict
 * giữa các node_modules/@types/express trong monorepo.
 */
export const authenticate = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện thao tác này',
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn, vui lòng đăng nhập lại',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ',
      });
    }
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền — phải dùng sau authenticate
 * 
 * @example
 * router.delete('/track/:id', authenticate, requireRole('admin'), handler)
 * router.post('/upload', authenticate, requireRole('artist', 'admin'), handler)
 */
export const requireRole = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền: [${roles.join(', ')}]`,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

let permissionsCache: any[] = [];
let lastCacheTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Middleware kiểm tra phân quyền động
 * 
 * @example
 * router.delete('/track/:id', authenticate, requirePermission('delete_any_track'), handler)
 */
export const requirePermission = (permissionId: string) => {
  return async (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng',
      });
    }

    try {
      if (Date.now() - lastCacheTime > CACHE_TTL || permissionsCache.length === 0) {
        const permissionUrl = process.env.PERMISSION_SERVICE_URL || 'http://permission-service:3009';
        const response = await fetch(`${permissionUrl}/permissions`);
        const data: any = await response.json();
        
        if (data && data.success) {
          permissionsCache = data.data;
          lastCacheTime = Date.now();
        }
      }

      const permConfig = permissionsCache.find(p => p.id === permissionId);
      
      if (!permConfig) {
        console.warn(`[Auth Warning]: Missing permission constraint for ID: ${permissionId}`);
        return res.status(403).json({
          success: false,
          message: `Bạn không có quyền truy cập (Không tìm thấy quyền: ${permissionId})`,
        });
      }

      const userRole = req.user.role;
      const hasAccess = permConfig.roles[userRole] === true;

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền truy cập cụ thể.`,
        });
      }

      next();
    } catch (error: any) {
      console.error("[Auth Error]: Failed to check dynamic permissions:", error.message);
      // Fallback: Nếu service phân quyền gián đoạn, tự động cho admin đi qua
      if (req.user.role === 'admin') {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Hệ thống phân quyền tạm thời gián đoạn',
      });
    }
  };
};
