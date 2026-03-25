import { Express, Request, Response, NextFunction } from "express";
import { serviceProxy } from "../middleware/serviceProxy";
import { AuthRequest } from "../middleware/authMiddleware";

export const criarRotasGateway = (
  app: Express,
  verificarToken: (req: AuthRequest, res: Response, next: NextFunction) => void
) => {
  // ===== AUTH ROUTES =====
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const result = await serviceProxy.gọi(
      "auth",
      "POST",
      "/auth/register",
      {},
      req.body
    );
    res.status(result.status).json(result.data);
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const result = await serviceProxy.gọi(
      "auth",
      "POST",
      "/auth/login",
      {},
      req.body
    );
    res.status(result.status).json(result.data);
  });

  app.post(
    "/api/auth/refresh",
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "auth",
        "POST",
        "/auth/refresh",
        { headers: { Authorization: req.headers!.authorization || "" } },
        req.body
      );
      res.status(result.status).json(result.data);
    }
  );

  app.post(
    "/api/auth/logout",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "auth",
        "POST",
        "/auth/logout",
        { headers: { Authorization: req.headers!.authorization || "" } },
        {}
      );
      res.status(result.status).json(result.data);
    }
  );

  // ===== USER ROUTES =====
  app.get(
    "/api/users/profile",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "user",
        "GET",
        `/users/profile/${req.user?.userId}`,
        { headers: { Authorization: req.headers!.authorization || "" } }
      );
      res.status(result.status).json(result.data);
    }
  );

  app.put(
    "/api/users/profile",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "user",
        "PUT",
        `/users/profile/${req.user?.userId}`,
        { headers: { Authorization: req.headers!.authorization || "" } },
        req.body
      );
      res.status(result.status).json(result.data);
    }
  );

  app.get("/api/users/:userId", async (req: Request, res: Response) => {
    const result = await serviceProxy.gọi(
      "user",
      "GET",
      `/users/${req.params!.userId}`,
      {}
    );
    res.status(result.status).json(result.data);
  });

  app.post(
    "/api/users/:userId/follow",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "user",
        "POST",
        `/users/${req.params!.userId}/follow`,
        { headers: { Authorization: req.headers!.authorization || "" } },
        {}
      );
      res.status(result.status).json(result.data);
    }
  );

  // ===== CATALOG ROUTES =====
  app.get("/api/tracks", async (req: Request, res: Response) => {
    const result = await serviceProxy.gọi(
      "catalog",
      "GET",
      `/tracks?limit=${req.query!.limit || 20}&offset=${req.query!.offset || 0}`,
      {}
    );
    res.status(result.status).json(result.data);
  });

  app.get("/api/tracks/:trackId", async (req: Request, res: Response) => {
    const result = await serviceProxy.gọi(
      "catalog",
      "GET",
      `/tracks/${req.params!.trackId}`,
      {}
    );
    res.status(result.status).json(result.data);
  });

  app.get("/api/artists", async (req: Request, res: Response) => {
    const result = await serviceProxy.gọi(
      "catalog",
      "GET",
      `/artists?limit=${req.query!.limit || 20}&offset=${req.query!.offset || 0}`,
      {}
    );
    res.status(result.status).json(result.data);
  });

  app.get("/api/artists/:artistId", async (req: Request, res: Response) => {
    const result = await serviceProxy.gọi(
      "catalog",
      "GET",
      `/artists/${req.params!.artistId}`,
      {}
    );
    res.status(result.status).json(result.data);
  });

  app.get("/api/albums", async (req: Request, res: Response) => {
    const result = await serviceProxy.gọi(
      "catalog",
      "GET",
      `/albums?limit=${req.query!.limit || 20}&offset=${req.query!.offset || 0}`,
      {}
    );
    res.status(result.status).json(result.data);
  });

  // ===== PLAYLIST ROUTES =====
  app.post(
    "/api/playlists",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "playlist",
        "POST",
        "/playlists",
        { headers: { Authorization: req.headers!.authorization || "" } },
        { ...req.body, userId: req.user?.userId }
      );
      res.status(result.status).json(result.data);
    }
  );

  app.get("/api/playlists/:playlistId", async (req: Request, res: Response) => {
    const result = await serviceProxy.gọi(
      "playlist",
      "GET",
      `/playlists/${req.params!.playlistId}`,
      {}
    );
    res.status(result.status).json(result.data);
  });

  app.put(
    "/api/playlists/:playlistId",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "playlist",
        "PUT",
        `/playlists/${req.params!.playlistId}`,
        { headers: { Authorization: req.headers!.authorization || "" } },
        req.body
      );
      res.status(result.status).json(result.data);
    }
  );

  app.delete(
    "/api/playlists/:playlistId",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "playlist",
        "DELETE",
        `/playlists/${req.params!.playlistId}`,
        { headers: { Authorization: req.headers!.authorization || "" } }
      );
      res.status(result.status).json(result.data);
    }
  );

  app.post(
    "/api/playlists/:playlistId/tracks",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "playlist",
        "POST",
        `/playlists/${req.params!.playlistId}/tracks`,
        { headers: { Authorization: req.headers!.authorization || "" } },
        req.body
      );
      res.status(result.status).json(result.data);
    }
  );

  // ===== LIKES ROUTES =====
  app.post(
    "/api/likes/tracks/:trackId",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "likes",
        "POST",
        `/likes/tracks/${req.params!.trackId}`,
        { headers: { Authorization: req.headers!.authorization || "" } },
        { userId: req.user?.userId }
      );
      res.status(result.status).json(result.data);
    }
  );

  app.delete(
    "/api/likes/tracks/:trackId",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "likes",
        "DELETE",
        `/likes/tracks/${req.params!.trackId}`,
        { headers: { Authorization: req.headers!.authorization || "" } }
      );
      res.status(result.status).json(result.data);
    }
  );

  app.get(
    "/api/likes/tracks",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "likes",
        "GET",
        `/likes/tracks?limit=${req.query!.limit || 20}&offset=${req.query!.offset || 0}`,
        { headers: { Authorization: req.headers!.authorization || "" } }
      );
      res.status(result.status).json(result.data);
    }
  );

  // ===== HISTORY ROUTES =====
  app.post(
    "/api/history/play",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "history",
        "POST",
        "/history/play",
        { headers: { Authorization: req.headers!.authorization || "" } },
        { ...req.body, userId: req.user?.userId }
      );
      res.status(result.status).json(result.data);
    }
  );

  app.get(
    "/api/history/recently-played",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "history",
        "GET",
        `/history/recently-played?limit=${req.query!.limit || 20}`,
        { headers: { Authorization: req.headers!.authorization || "" } }
      );
      res.status(result.status).json(result.data);
    }
  );

  // ===== SEARCH ROUTES =====
  app.get("/api/search", async (req: Request, res: Response) => {
    const query = req.query!.q || "";
    const type = req.query!.type || "all";
    const result = await serviceProxy.gọi(
      "search",
      "GET",
      `/search?q=${query}&type=${type}&limit=${req.query!.limit || 20}`,
      {}
    );
    res.status(result.status).json(result.data);
  });

  // ===== ADMIN ROUTES =====
  app.get(
    "/api/admin/stats",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "admin",
        "GET",
        "/admin/stats",
        { headers: { Authorization: req.headers!.authorization || "" } }
      );
      res.status(result.status).json(result.data);
    }
  );

  app.get(
    "/api/admin/logs",
    verificarToken,
    async (req: AuthRequest, res: Response) => {
      const result = await serviceProxy.gọi(
        "admin",
        "GET",
        `/admin/logs?limit=${req.query!.limit || 50}`,
        { headers: { Authorization: req.headers!.authorization || "" } }
      );
      res.status(result.status).json(result.data);
    }
  );
};
