# 🛠️ Hướng Dẫn Implementation Microservices

## Tình trạng hiện tại
 **Hoàn thành:**
- Folder structure cho 8 services + 1 gateway
- Basic server setup cho tất cả services
- API Gateway với routing cơ bản
- Service Proxy middleware
- Docker & Docker Compose setup
- Environment configuration

## ⏳ Công việc tiếp theo (Priority Order)

### Phase 1: Core Authentication (Auth Service)
**Ước lượng: 3-4 giờ**

1. **Models** (`src/models/`)
   - User schema (email, password, role, createdAt)
   - RefreshToken schema (token, userId, expiresAt)

2. **Services** (`src/services/`)
   - UserAuthService.ts
     - hashPassword()
     - comparePassword()
     - generateJWT()
     - generateRefreshToken()
     - verifyRefreshToken()

3. **Controllers** (`src/controllers/`)
   - AuthController.ts
     - register() → validate, hash, save, return token
     - login() → validate credentials, generate tokens
     - refresh() → verify refresh token, new access token
     - logout() → invalidate refresh token

4. **Routes** (`src/routes/`)
   - index.ts → POST /auth/register, /auth/login, etc.

5. **Middleware**
   - validateInput.ts → Validate email, password format
   - errorHandler.ts → Centralized error handling

### Phase 2: User Service
**Ước lượng: 3-4 giờ**

1. **Models**
   - UserProfile schema (name, avatar, bio, genre preferences)
   - UserSettings schema (privacy, notifications, etc.)
   - FollowRelation schema (follower, following, createdAt)

2. **Services**
   - UserProfileService.ts
   - UserFollowService.ts

3. **Controllers**
   - UserController.ts

4. **Routes**
   - userRoutes.ts

### Phase 3: Catalog Service
**Ước lượng: 4-5 giờ**

1. **Models**
   - Track schema (title, duration, artist, album, genre, url)
   - Artist schema (name, avatar, bio, genre)
   - Album schema (title, cover, artist, releaseDate, tracks)

2. **Services**
   - CatalogService.ts
   - BrowseService.ts (recommendations, trending)

3. **Controllers**
   - TrackController.ts
   - ArtistController.ts
   - AlbumController.ts

4. **Routes**

5. **Database Seeding**
   - Tạo sample data cho testing

### Phase 4: Playlist Service
**Ước lượng: 3-4 giờ**

1. **Models**
   - Playlist schema (name, owner, tracks[], isPublic)
   - PlaylistTrack schema (playlistId, trackId, addedAt, order)

2. **Services**
   - PlaylistService.ts

3. **Controllers**
   - PlaylistController.ts

4. **Routes**

5. **Validation**
   - Check ownership trước update/delete

### Phase 5: Likes Service
**Ước lượng: 2 giờ**

1. **Models**
   - Like schema (userId, trackId, createdAt) - unique index

2. **Services**
   - LikeService.ts

3. **Controllers**
   - LikeController.ts

4. **Routes**

### Phase 6: History Service
**Ước lượng: 2 giờ**

1. **Models**
   - PlayEvent schema (userId, trackId, playedAt, duration)

2. **Services**
   - HistoryService.ts

3. **Controllers**
   - HistoryController.ts

4. **Routes**

### Phase 7: Search Service
**Ước lượng: 3 giờ**

1. **Setup MongoDB Text Indexes**
   - Track.createIndex({ title: "text", artist: "text" })
   - Artist.createIndex({ name: "text", genre: "text" })
   - Playlist.createIndex({ name: "text" })

2. **SearchEngine** (src/services/)
   - searchTracks()
   - searchArtists()
   - searchPlaylists()

3. **Controllers**
   - SearchController.ts

4. **Routes**

### Phase 8: Admin Service
**Ước lượng: 2-3 giờ**

1. **Models**
   - AuditLog schema (action, userId, resource, timestamp)

2. **Services**
   - AdminService.ts
   - AuditService.ts

3. **Controllers**
   - AdminController.ts

4. **Routes**

5. **Middleware**
   - checkAdminRole() → Verify admin access

---

## 🔄 Development Workflow

### Mỗi service cần theo pattern này:

```
src/
├── models/           (Mongoose schemas)
├── services/         (Business logic)
├── controllers/      (Request handlers)
├── routes/           (Express routes)
├── middleware/       (Custom middleware)
├── utils/            (Helper functions)
├── validation/       (Input validation schemas)
└── types/            (TypeScript interfaces)
```

### Checklist cho mỗi endpoint:

- [ ] Define TypeScript interfaces
- [ ] Create Mongoose model
- [ ] Write service business logic
- [ ] Create controller
- [ ] Define routes
- [ ] Add input validation
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Test with Postman/curl

---

## 📚 File Templates

### Service Template:
```typescript
// src/services/ExampleService.ts
export class ExampleService {
  async create(data: any) { }
  async read(id: string) { }
  async update(id: string, data: any) { }
  async delete(id: string) { }
  async list(filter?: any) { }
}
```

### Controller Template:
```typescript
// src/controllers/ExampleController.ts
import { Request, Response } from "express";
import { ExampleService } from "../services/ExampleService";

const service = new ExampleService();

export const create = async (req: Request, res: Response) => {
  try {
    const result = await service.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Route Template:
```typescript
// src/routes/exampleRoutes.ts
import { Router } from "express";
import * as controller from "../controllers/ExampleController";
import { verificarToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/", verificarToken, controller.create);
router.get("/:id", controller.read);
router.put("/:id", verificarToken, controller.update);
router.delete("/:id", verificarToken, controller.delete);
router.get("/", controller.list);

export default router;
```

---

## 🧪 Testing Strategy

1. **Unit Tests** (Jest)
   - Test service methods individually
   - Mock database calls

2. **Integration Tests**
   - Test full request/response cycle
   - Use test database

3. **E2E Tests**
   - Test entire workflow through API Gateway
   - Test inter-service calls

---

## 🚀 Deployment Checklist

- [ ] All services pass linting (ESLint)
- [ ] All services compiled (TSC no errors)
- [ ] All environment variables set
- [ ] All Dockerfiles tested
- [ ] Docker Compose tested
- [ ] MongoDB connection tested
- [ ] API Gateway health check passes
- [ ] All services health check passes
- [ ] Rate limiting configured
- [ ] CORS properly configured

---

## 📞 Support

Nếu cần hỗ trợ, check:
- [Docker Docs](https://docs.docker.com/)
- [Express Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)

Bắt đầu implementation từ **Auth Service** trước nhé! 🚀
