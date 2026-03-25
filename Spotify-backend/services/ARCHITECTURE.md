# 🏗️ Spotify Microservices Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Spotify App │  │  Admin Panel  │  │  Mobile App (Web)     │   │
│  │ (User/Music) │  │ (spotify-admin)  │ (spotify-clone)      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
             └───────────────────┬───────────┘
                                 │
                    ┏────────────▼────────────┓
                    ┃  API GATEWAY (3000)     ┃
                    ┃  ┌──────────────────┐   ┃
                    ┃  │ · CORS           │   ┃
                    ┃  │ · Rate Limiting  │   ┃
                    ┃  │ · Auth Verify    │   ┃
                    ┃  │ · Request Route  │   ┃
                    ┃  │ · Logging        │   ┃
                    ┃  └──────────────────┘   ┃
                    ┗───────┬────────────┬────┛
                            │            │
        ┌───────────────────┼────────────┼───────────────────┐
        │                   │            │                   │
        ▼                   ▼            ▼                   ▼
    ┌────────────┐     ┌────────────┐  ┌────────────┐  ┌────────────┐
    │   AUTH     │     │    USER    │  │  CATALOG   │  │  PLAYLIST  │
    │  SERVICE   │     │  SERVICE   │  │  SERVICE   │  │  SERVICE   │
    │  (3001)    │     │  (3002)    │  │  (3003)    │  │  (3004)    │
    ├────────────┤     ├────────────┤  ├────────────┤  ├────────────┤
    │ · Register │     │ · Profile  │  │ · Tracks   │  │ · Create   │
    │ · Login    │     │ · Settings │  │ · Artists  │  │ · Update   │
    │ · Refresh  │     │ · Follow   │  │ · Albums   │  │ · Delete   │
    │ · Logout   │     │ · RBAC     │  │ · Browse   │  │ · Add Track│
    │ · JWT Mgmt │     │            │  │ · Search   │  │ · Remove   │
    └────────────┘     └────────────┘  └────────────┘  └────────────┘
        │                   │              │                 │
        └───────────────────┼──────────────┼─────────────────┘
                            │              │
        ┌───────────────────┼──────────────┼─────────────────┐
        │                   │              │                 │
        ▼                   ▼              ▼                 ▼
    ┌────────────┐     ┌────────────┐  ┌────────────┐  ┌────────────┐
    │   LIKES    │     │  HISTORY   │  │   SEARCH   │  │   ADMIN    │
    │  SERVICE   │     │   SERVICE  │  │  SERVICE   │  │  SERVICE   │
    │  (3005)    │     │  (3006)    │  │  (3007)    │  │  (3008)    │
    ├────────────┤     ├────────────┤  ├────────────┤  ├────────────┤
    │ · Like     │     │ · Record   │  │ · Full Text│  │ · Stats    │
    │ · Unlike   │     │   Play     │  │   Search   │  │ · CMS      │
    │ · List     │     │ · Recently │  │ · Filter   │  │ · Audit    │
    │ · Count    │     │   Played   │  │ · Suggest  │  │   Logs     │
    └────────────┘     └────────────┘  └────────────┘  └────────────┘
        │                   │              │                 │
        └───────────────────┴──────────────┴─────────────────┘
                            │
                ┏───────────▼───────────┓
                ┃   MONGODB (27017)     ┃
                ┃  ┌───────────────┐    ┃
                ┃  │ Collections:  │    ┃
                ┃  │ · users       │    ┃
                ┃  │ · tracks      │    ┃
                ┃  │ · artists     │    ┃
                ┃  │ · albums      │    ┃
                ┃  │ · playlists   │    ┃
                ┃  │ · likes       │    ┃
                ┃  │ · play_events │    ┃
                ┃  │ · audit_logs  │    ┃
                ┃  └───────────────┘    ┃
                ┗───────────────────────┘
```

## Request Flow

### 1. User Registration Flow
```
Client
  │
  ├──→ POST /api/auth/register
  │     (email, password)
  │
  └──→ API Gateway
       │
       ├──→ Auth Service
       │    │
       │    ├─→ Validate Input
       │    ├─→ Hash Password
       │    └─→ Create User (MongoDB)
       │
       └──→ Return JWT Token
            │
            └─→ Client (JWT stored in localStorage)
```

### 2. Get User Tracks Flow
```
Client (with JWT)
  │
  ├──→ GET /api/tracks
  │
  └──→ API Gateway
       │
       ├─→ Verify JWT Token
       │
       ├──→ Catalog Service
       │    │
       │    ├─→ Query MongoDB
       │    │   (Track collection)
       │    │
       │    └─→ Return Tracks
       │
       └──→ Client (Track List)
```

### 3. Like Track Flow
```
Client (with JWT)
  │
  ├──→ POST /api/likes/tracks/:trackId
  │
  └──→ API Gateway
       │
       ├─→ Verify JWT
       ├─→ Extract userId from token
       │
       ├──→ Likes Service
       │    │
       │    ├─→ Check if already liked
       │    ├─→ Save Like to MongoDB
       │    └─→ Return Success
       │
       ├──→ History Service (async)
       │    └─→ Log like event
       │
       └──→ Client (Success)
```

### 4. Create Playlist Flow
```
Client (with JWT)
  │
  ├──→ POST /api/playlists
  │    (name, description)
  │
  └──→ API Gateway
       │
       ├─→ Verify JWT
       ├─→ Extract userId
       │
       ├──→ Playlist Service
       │    │
       │    ├─→ Validate Input
       │    ├─→ Create Playlist
       │    │   (MongoDB)
       │    │
       │    └─→ Return Playlist
       │
       └──→ Client (Playlist Created)
```

## Service Interaction Patterns

### Direct Communication (Internal Only)
```
Playlist Service ──http──> Catalog Service
  (need track info)      (get track details)
```

### Via API Gateway (Public)
```
Client ──http──> API Gateway ──http──> Service
```

### Async Processing (Optional)
```
Service A
  │
  ├─→ Emit Event (RabbitMQ/Kafka)
  │
  └─→ Service B
       ├─→ Consume Event
       └─→ Process Asynchronously
```

## Database Schema Relationships

```
┌──────────────────────────────────────────────────────────┐
│                        MongoDB                             │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  users                                                     │
│  ├─ _id (ObjectId)                                         │
│  ├─ email (String)                                         │
│  ├─ password (String - hashed)                             │
│  ├─ role (String) ─────────────┐                           │
│  ├─ createdAt (Date)           │                           │
│  └─ settings (Object)          │                           │
│                                │ RBAC                       │
│  tracks                         │                           │
│  ├─ _id (ObjectId)             │                           │
│  ├─ title (String)             │                           │
│  ├─ artist (ObjectId) ──────────────> artists             │
│  ├─ album (ObjectId) ───────────────> albums              │
│  ├─ duration (Number)          │                           │
│  ├─ genre (String)             │                           │
│  └─ url (String)               │                           │
│                                │                           │
│  playlists                      │                           │
│  ├─ _id (ObjectId)             │                           │
│  ├─ name (String)              │                           │
│  ├─ owner (ObjectId) ──────────────── users ◄─────────────┘
│  ├─ tracks (Array<ObjectId>)   │
│  └─ isPublic (Boolean)         │
│                                │
│  likes                          │
│  ├─ _id (ObjectId)             │
│  ├─ userId (ObjectId) ─────────────> users
│  ├─ trackId (ObjectId) ───────────> tracks
│  └─ createdAt (Date)
│
│  play_events
│  ├─ _id (ObjectId)
│  ├─ userId (ObjectId) ─────────────> users
│  ├─ trackId (ObjectId) ───────────> tracks
│  └─ playedAt (Date)
│
└──────────────────────────────────────────────────────────┘
```

## Deployment Strategy

### Development
```
Local Machine
├─ MongoDB (local)
├─ API Gateway (localhost:3000)
├─ Auth Service (localhost:3001)
├─ User Service (localhost:3002)
└─ ... (other services)
```

### Docker/Docker Compose
```
Docker Network
├─ MongoDB Container
├─ API Gateway Container
├─ Auth Service Container
├─ User Service Container
└─ ... (other services)
```

### Kubernetes (Future)
```
Kubernetes Cluster
├─ MongoDB StatefulSet
├─ API Gateway Deployment
├─ Auth Service Deployment
├─ User Service Deployment
├─ Service Discovery
├─ Ingress Controller
└─ ... (other services)
```

## Environment Variables Flow

```
.env (root)
    ├─→ services/.env.example
    │   ├─→ api-gateway/.env
    │   ├─→ auth-service/.env
    │   ├─→ user-service/.env
    │   └─ ... (other services)
    │
    └─→ process.env (Runtime)
        ├─ JWT_SECRET
        ├─ MONGODB_URI
        ├─ GATEWAY_PORT
        └─ ... (other variables)
```

## Error Handling Flow

```
Request ──error──> Service
                     │
                     ├─→ Log Error
                     │
                     ├─→ API Gateway
                     │    │
                     │    ├─→ Format Error
                     │    ├─→ Add Timestamp
                     │    └─→ Send Response
                     │
                     └─→ Client (Error object)
```

## Monitoring Points

```
API Gateway
├─ Request Count
├─ Response Time
├─ Error Rate
└─ Rate Limit Hits

Per Service
├─ Health Status
├─ Response Time
├─ Error Rate
└─ Database Queries

MongoDB
├─ Connection Pool
├─ Query Performance
├─ Data Size
└─ Backup Status
```

---

**หมายเหตุ**: Architecture นี้สามารถ scale ได้และเหมาะสำหรับ production environments. 🚀
