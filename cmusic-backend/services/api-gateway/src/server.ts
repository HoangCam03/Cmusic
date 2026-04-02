import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { authenticate, authorize } from "./middleware/authMiddleware";
import { errorMiddleware } from "@spotify/libs/middleware/error.middleware";
import { SERVICES } from "./config/services";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.GATEWAY_PORT || "3000", 10);

// ===== CORE MIDDLEWARES =====

// CORS configuration
app.use(
  cors({
    origin: true, // Cho phép mọi Origin trong môi trường Dev (Vite thường đổi port sang 5174, 5175...)
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body Parser only for non-proxy requests (Health checks, etc.)
// Note: Proxied requests will have their body parsed automatically by the middleware or left as-is and forwarded.
// If we parse here, we must re-stringify when proxying. 
// A better way is to only parse for routes that aren't proxied or use the 'onProxyReq' option.
app.use(express.json({ limit: "50mb" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ===== PROXY CONFIGURATION HELPER =====
// NOTE: Express strips the mount prefix before passing to proxy middleware.
// e.g., app.use("/api/auth", proxy) → proxy only sees "/login" (not "/api/auth/login")
// So we must PREPEND the internal service prefix back.
const createProxy = (target: string, internalPrefix: string = ''): Options => ({
  target,
  changeOrigin: true,
  pathRewrite: internalPrefix
    ? { '^/': `${internalPrefix}/` }  // e.g., /login → /auth/login
    : undefined,
  on: {
    proxyReq: (proxyReq, req: any, res) => {
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
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

// 2. User Service: /api/users/profile → proxy sees /profile → prepend /users → /users/profile ✓
app.use("/api/users", authenticate, createProxyMiddleware(createProxy(SERVICES.USER, '/users')));

// 3. Catalog Service: /api/catalog/tracks → proxy sees /tracks → no prefix needed ✓
app.use("/api/catalog", (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') {
    return authenticate(req as any, res, next);
  }
  next();
}, createProxyMiddleware(createProxy(SERVICES.CATALOG)));

// 4. Playlist Service: /api/playlists/... → proxy sees /... → prepend /playlists
app.use("/api/playlists", authenticate, createProxyMiddleware(createProxy(SERVICES.PLAYLIST, '/playlists')));

// 5. Likes Service
app.use("/api/likes", authenticate, createProxyMiddleware(createProxy(SERVICES.LIKES, '/likes')));

// 6. History Service
app.use("/api/history", authenticate, createProxyMiddleware(createProxy(SERVICES.HISTORY, '/history')));

// 7. Search Service
app.use("/api/search", createProxyMiddleware(createProxy(SERVICES.SEARCH, '/search')));

// 8. Admin Service (Protected + Role Admin)
app.use("/api/admin", authenticate, authorize(['admin']), createProxyMiddleware(createProxy(SERVICES.ADMIN, '/admin')));

// ===== GLOBAL ERROR HANDLING =====
app.use(errorMiddleware as any);

// Catch 404
app.use((req: Request, res: Response) => {
  console.log(` Route Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ===== START GATEWAY =====
app.listen(PORT, () => {
  console.log(`🚀 API Gateway v2.0 is running at http://localhost:${PORT}`);
  console.log(`📡 Backend services targets: ${JSON.stringify(SERVICES, null, 2)}`);
});

export default app;
