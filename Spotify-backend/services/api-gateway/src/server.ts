import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { authenticate, authorize } from "./middleware/authMiddleware.js";
import { errorMiddleware } from "@libs/middleware/error.middleware.js";
import { SERVICES } from "./config/services.js";

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.GATEWAY_PORT || "3000", 10);

// ===== CORE MIDDLEWARES =====

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      process.env.ADMIN_URL || "http://localhost:5174",
    ],
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
const createProxy = (target: string, pathRewritePrefix: string = '/api'): Options => ({
  target,
  changeOrigin: true,
  pathRewrite: {
    [`^${pathRewritePrefix}`]: '', // Remove /api prefix when sending to microservice
  },
  on: {
    proxyReq: (proxyReq, req: any, res) => {
      // If the request body was already parsed by express.json(), 
      // we need to re-stringify it for the proxy.
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    error: (err: any, req, res: any) => {
      console.error(`❌ Proxy Error [${target}]:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'Bad Gateway - Service is unavailable' });
      }
    }
  }
});

// ===== ROUTES & PROXYING =====

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", service: "api-gateway", timestamp: new Date() });
});

// 1. Auth Service Proxy (Public - No authenticate needed for login/register)
app.use("/api/auth", createProxyMiddleware(createProxy(SERVICES.AUTH)));

// 2. User Service Proxy (Partially Protected)
app.use("/api/users", authenticate, createProxyMiddleware(createProxy(SERVICES.USER)));

// 3. Catalog Service Proxy (Public for search/browse, PROTECTED for modifications)
app.use("/api/catalog", (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') {
    return authenticate(req as any, res, next);
  }
  next();
}, createProxyMiddleware(createProxy(SERVICES.CATALOG)));

// 4. Playlist Service Proxy (Protected)
app.use("/api/playlists", authenticate, createProxyMiddleware(createProxy(SERVICES.PLAYLIST)));

// 5. Likes Service Proxy (Protected)
app.use("/api/likes", authenticate, createProxyMiddleware(createProxy(SERVICES.LIKES)));

// 6. History Service Proxy (Protected)
app.use("/api/history", authenticate, createProxyMiddleware(createProxy(SERVICES.HISTORY)));

// 7. Search Service Proxy (Public)
app.use("/api/search", createProxyMiddleware(createProxy(SERVICES.SEARCH)));

// 8. Admin Service Proxy (Protected + Role Admin)
app.use("/api/admin", authenticate, authorize(['admin']), createProxyMiddleware(createProxy(SERVICES.ADMIN)));

// ===== GLOBAL ERROR HANDLING =====
app.use(errorMiddleware as any);

// Catch 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ===== START GATEWAY =====
app.listen(PORT, () => {
  console.log(`🚀 API Gateway v2.0 is running at http://localhost:${PORT}`);
  console.log(`📡 Backend services targets: ${JSON.stringify(SERVICES, null, 2)}`);
});

export default app;
