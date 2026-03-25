# 📝 Spotify Microservices - Lệnh Hữu Ích

##  Quick Start

### Setup lần đầu
```bash
# 1. Copy env file
cp .env.example .env

# 2. Cài đặt dependencies cho tất cả services
npm run install-all

# 3. Chạy với Docker Compose (khuyến nghị)
npm run docker:build
npm run docker:up

# 4. Check health tất cả services
npm run health:check
```

## 🐳 Docker Commands

```bash
# Build tất cả images
npm run docker:build

# Start tất cả containers
npm run docker:up

# Stop tất cả containers
npm run docker:down

# Xem logs tất cả services
npm run docker:logs

# Xem logs của service cụ thể
npm run docker:logs:gateway
npm run docker:logs:auth
npm run docker:logs:user
# ... etc

# Restart tất cả containers
npm run docker:restart
```

## 🏥 Health Checks

```bash
# Check tất cả services
npm run health:check

# Check service cụ thể
npm run health:gateway
npm run health:auth
npm run health:user
npm run health:catalog
npm run health:playlist
npm run health:likes
npm run health:history
npm run health:search
npm run health:admin
```

## 🛠️ Development (Local Services)

### API Gateway (Port 3000)
```bash
cd api-gateway

# Dev mode (watch files)
npm run dev

# Build
npm run build

# Production
npm start
```

### Auth Service (Port 3001)
```bash
cd auth-service
npm run dev
```

### User Service (Port 3002)
```bash
cd user-service
npm run dev
```

### Catalog Service (Port 3003)
```bash
cd catalog-service
npm run dev
```

### Playlist Service (Port 3004)
```bash
cd playlist-service
npm run dev
```

### Likes Service (Port 3005)
```bash
cd likes-service
npm run dev
```

### History Service (Port 3006)
```bash
cd history-service
npm run dev
```

### Search Service (Port 3007)
```bash
cd search-service
npm run dev
```

### Admin Service (Port 3008)
```bash
cd admin-service
npm run dev
```

## 📦 Build Commands

```bash
# Build tất cả services
npm run build-all

# Build service cụ thể
npm run build:gateway
npm run build:auth
npm run build:user
# ... etc
```

## 🔗 API Testing

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"securePassword123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"securePassword123"
  }'

# Get tracks (with token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/tracks

# Create playlist (with token)
curl -X POST http://localhost:3000/api/playlists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name":"My Awesome Playlist",
    "description":"A playlist of my favorite songs"
  }'

# Like a track (with token)
curl -X POST http://localhost:3000/api/likes/tracks/TRACK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search
curl "http://localhost:3000/api/search?q=adele&type=tracks"
```

### Using Postman

1. Import collection từ `postman_collection.json` (sẽ tạo sau)
2. Set environment variables:
   - `API_URL`: http://localhost:3000
   - `JWT_TOKEN`: <token từ login>
3. Run requests

## 🗄️ MongoDB Commands

```bash
# Connect to MongoDB (nếu chạy Docker)
docker exec -it spotify-mongodb mongosh -u admin -p admin123

# Some useful commands
show databases
use spotify
show collections
db.users.find()
db.tracks.find()
db.playlists.find()
```

## 🔍 Debugging

### View logs
```bash
# Docker logs
docker-compose logs -f auth-service

# Or từ root services folder
npm run docker:logs

# Or specific service
tail -f logs/auth-service.log
```

### MongoDB Query Examples
```javascript
// Find all users
db.users.find()

// Find user by email
db.users.findOne({ email: "user@example.com" })

// Find all tracks
db.tracks.find().limit(10)

// Find liked tracks
db.likes.find({ userId: ObjectId("...") })

// Find user's playlists
db.playlists.find({ owner: ObjectId("...") })
```

## 🧹 Cleanup

```bash
# Remove all images & containers
docker-compose down -v

# Remove node_modules từ tất cả services
find . -name "node_modules" -type d -exec rm -rf {} +

# Remove dist folders
find . -name "dist" -type d -exec rm -rf {} +
```

## 📊 Monitor Services

### Check running containers
```bash
docker ps

# Hoặc
docker-compose ps
```

### Check container resources
```bash
docker stats

# Hoặc
docker stats spotify-api-gateway spotify-auth-service
```

### Check logs of failed container
```bash
docker logs <container_id>
```

## 🚨 Troubleshooting

### Service không start
```bash
# Check logs
docker-compose logs auth-service

# Restart service
docker-compose restart auth-service

# Rebuild image
docker-compose build --no-cache auth-service
docker-compose up -d auth-service
```

### MongoDB connection error
```bash
# Check MongoDB is running
docker-compose logs mongodb

# Verify connection string in .env
# Default: mongodb://admin:admin123@mongodb:27017/spotify

# Test connection
docker exec spotify-mongodb mongosh -u admin -p admin123 --eval "db.adminCommand('ping')"
```

### Port already in use
```bash
# Find what's using port 3000
lsof -i :3000

# Or kill it
kill -9 <PID>

# Change port in .env or run on different machine
```

##  Deployment Checklist

- [ ] All .env variables set correctly
- [ ] MongoDB backup made
- [ ] All services built successfully (`npm run build-all`)
- [ ] All health checks passing (`npm run health:check`)
- [ ] Rate limiting configured appropriately
- [ ] CORS origins configured
- [ ] JWT secrets changed from default
- [ ] Database indexes created
- [ ] Logs configured
- [ ] Monitoring setup (optional)

## 📚 Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js guide](https://expressjs.com/)
- Microservices architecture best practices: https://microservices.io/

---

**Tip**: Lưu file này và thường xuyên refer lại! 💡
