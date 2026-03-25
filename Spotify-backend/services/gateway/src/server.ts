import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const port = Number(process.env.GATEWAY_PORT || process.env.PORT || 4000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4010";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:4020";
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || "http://localhost:4030";
const PLAYLIST_SERVICE_URL = process.env.PLAYLIST_SERVICE_URL || "http://localhost:4040";

app.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", service: "gateway" }));

app.use(
  "/api/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "/api/auth" },
  })
);

app.use(
  "/api/user",
  createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/user": "/api/user" },
  })
);

app.use(
  "/api/catalog",
  createProxyMiddleware({
    target: CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/catalog": "/api/catalog" },
  })
);

app.use(
  "/api/playlist",
  createProxyMiddleware({
    target: PLAYLIST_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/playlist": "/api/playlist" },
  })
);

app.get("/", (_req: Request, res: Response) => res.send("Gateway is running"));

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Gateway listening on port ${port}`);
});

