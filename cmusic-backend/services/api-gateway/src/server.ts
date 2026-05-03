import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { authenticate, authorize, requirePermission } from "./middleware/authMiddleware";
import { verifyAccessToken } from "@spotify/libs/utils/jwt.helper";
import { errorMiddleware } from "@spotify/libs/middleware/error.middleware";
import { SERVICES } from "./config/services";

import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  }
});

const PORT = parseInt(process.env.GATEWAY_PORT || "3000", 10);

// Global socket handling
io.on("connection", (socket: any) => {
  console.log(`[SOCKET]: Client connected: ${socket.id}`);

  socket.on("join_admin_room", () => {
    socket.join("admin_dashboard");
    console.log(`[SOCKET]: Client ${socket.id} joined admin room`);
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET]: Client disconnected: ${socket.id}`);
  });
});

// Middleware to inject IO into requests
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// ===== CORE MIDDLEWARES =====

// 1. Manual CORS & Preflight (MUST BE FIRST)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id, Accept");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// 2. Body Parser - ONLY for routes owned by Gateway (not proxied)
const jsonParser = express.json({ limit: "50mb" });
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors({ origin: true, credentials: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000,
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const createProxy = (target: string, internalPrefix: string = ''): Options => ({
  target,
  changeOrigin: true,
  pathRewrite: internalPrefix
    ? { '^/': `${internalPrefix}/` }
    : undefined,
  on: {
    proxyReq: (proxyReq: any, req: any, res: any) => {
      console.log(`[GATEWAY PROXY] Forwarding ${req.method} ${req.originalUrl} -> ${target}${proxyReq.path}`);
      
      // Ưu tiên lấy từ req.user (đã qua authenticate middleware)
      const userId = req.user?.userId || req.headers['x-user-id'];
      const permissions = req.headers['x-user-permissions'] || '';
      const role = req.user?.role || req.headers['x-user-role'] || '';

      if (userId) {
        proxyReq.setHeader('x-user-id', userId);
      }
      if (permissions) {
        proxyReq.setHeader('x-user-permissions', permissions);
      }
      if (role) {
        proxyReq.setHeader('x-user-role', role);
      }
    },
    error: (err: any, req, res: any) => {
      console.error(` Proxy Error [${target}]:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Bad Gateway - Service is unavailable' });
      }
    }
  }
});

// ===== ROUTES & PROXYING =====

// Request Logger for debugging
app.use((req, res, next) => {
  console.log(`[GATEWAY REQUEST]: ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", service: "api-gateway", timestamp: new Date() });
});

// 1. Auth Service: /api/auth/login → proxy sees /login → prepend /auth → /auth/login ✓
app.use("/api/auth", createProxyMiddleware(createProxy(SERVICES.AUTH, '/auth')));

app.use("/api/users", authenticate, createProxyMiddleware(createProxy(SERVICES.USER, '/users')));


// 3. Catalog Service - Dedicated proxy with NO interference for file streams
const catalogProxy = createProxyMiddleware({
  target: SERVICES.CATALOG,
  changeOrigin: true,
  xfwd: true, // Chuyển tiếp các IP headers
  proxyTimeout: 600000,
  timeout: 600000,
  on: {
    error: (err: any, req, res: any) => {
      console.error(` Proxy Error [CATALOG]:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Catalog Service không phản hồi (Timeout/Network Error)' });
      }
    }
  }
});

app.use("/api/catalog", async (req: any, res: Response, next: NextFunction) => {
  // Inject IO for real-time play counts
  if (req.method === 'PATCH' && req.path.endsWith('/play')) {
    const trackId = req.path.split('/')[2];
    io.to("admin_dashboard").emit("track_played", { trackId, timestamp: new Date() });
  }

  // Tự động giải mã token cho GET requests để hỗ trợ filter ?mine=true
  if (req.method === 'GET' && req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = verifyAccessToken(token);
      req.headers["x-user-id"] = decoded.userId;
      req.headers["x-user-role"] = decoded.role;
    } catch (err) {
      // Bỏ qua lỗi xác thực cho GET để cho phép truy cập public
    }
  }

  if (req.method !== 'GET') {
    // Sử dụng middleware xác thực đã được cải tiến (async - handles x-user-id & x-user-permissions)
    return authenticate(req as any, res, () => {
      // Xóa Authorization header sau khi đã xác thực xong để bảo mật thông tin nội bộ
      delete req.headers['authorization'];
      next();
    });
  }
  next();
}, catalogProxy);

// 4. Playlist Service
app.use("/api/playlists", (req: any, res: Response, next: NextFunction) => {
  // Cho phép lấy playlist công khai mà không cần đăng nhập
  if (req.method === 'GET' && req.path.startsWith('/public')) {
    return next();
  }
  return authenticate(req as any, res, next);
}, createProxyMiddleware({
  target: SERVICES.PLAYLIST,
  changeOrigin: true,
  pathRewrite: { '^/api/playlists': '' }
}));

// 5. Likes Service
app.use("/api/likes", authenticate, createProxyMiddleware({
  target: SERVICES.LIKES,
  changeOrigin: true,
  pathRewrite: {
    '^/api/likes': ''
  },
  on: {
    proxyReq: (proxyReq: any, req: any, res: any) => {
      console.log(`[GATEWAY PROXY - LIKES] Forwarding ${req.method} ${req.originalUrl} -> ${SERVICES.LIKES}${proxyReq.path}`);
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.userId);
        proxyReq.setHeader('x-user-permissions', req.headers['x-user-permissions'] || '');
      }
    }
  }
}));

// 6. History Service
app.use("/api/history", authenticate, createProxyMiddleware(createProxy(SERVICES.HISTORY)));

// 7. Search Service
app.use("/api/search", createProxyMiddleware(createProxy(SERVICES.SEARCH)));

// 8. Admin Service
app.use("/api/admin", authenticate, requirePermission('view_dashboard'), createProxyMiddleware({
  target: SERVICES.ADMIN,
  changeOrigin: true,
  pathRewrite: { '^/api/admin': '' }
}));

// 9. Permission Service
app.use("/api/permissions", authenticate, requirePermission('manage_permissions'), createProxyMiddleware({
  target: SERVICES.PERMISSION,
  changeOrigin: true,
  pathRewrite: { '^/api/permissions': '/permissions' }
}));

app.use("/api/plan-features", authenticate, requirePermission('manage_permissions'), createProxyMiddleware({
  target: SERVICES.PERMISSION,
  changeOrigin: true,
  pathRewrite: { '^/api/plan-features': '/plan-features' }
}));

// 10. Notification Service
app.use("/api/notifications", authenticate, createProxyMiddleware({
  target: SERVICES.NOTIFICATION,
  changeOrigin: true,
  pathRewrite: { '^/': '/api/notifications/' },
  on: {
    proxyReq: (proxyReq: any, req: any) => {
      console.log(`[GATEWAY PROXY] Forwarding ${req.method} ${req.originalUrl} -> ${SERVICES.NOTIFICATION}${proxyReq.path}`);
      const userId = req.user?.userId || req.headers['x-user-id'];
      if (userId) proxyReq.setHeader('x-user-id', userId);
    },
    error: (_err: any, _req: any, res: any) => {
      if (!res.headersSent) res.status(502).json({ success: false, message: 'Notification Service unavailable' });
    }
  }
}));

// ===== GLOBAL ERROR HANDLING =====
app.use(errorMiddleware as any);

// Catch 404
app.use((req: Request, res: Response) => {
  console.log(` Route Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ===== START GATEWAY =====
httpServer.listen(PORT, () => {
  console.log(` API Gateway v2.0 (with Real-time) is running at http://localhost:${PORT}`);
  console.log(` Backend services targets: ${JSON.stringify(SERVICES, null, 2)}`);
});

export default app;
