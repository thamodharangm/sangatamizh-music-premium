- **Storage**: S3-compatible (MinIO for dev, AWS S3 for prod)
- **Worker**: FFmpeg transcoding service

## Local Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Git

### Quick Start

1. **Clone and setup environment**

```bash
cp .env.example .env
# Edit .env with your values
```

2. **Start infrastructure (Database, Redis, MinIO)**

```bash
docker-compose up -d
```

3. **Setup backend**

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

4. **Setup frontend**

```bash
cd frontend
npm install
npm run dev
```

5. **Access the app**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MinIO Console: http://localhost:9001

## Project Structure

```
/
├── frontend/          # React + Vite app
├── backend/           # Express API + Worker
├── infra/             # Docker configs
├── docs/              # Architecture docs
└── scripts/           # Helper scripts
```

## API Endpoints

### Auth

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login (returns access token + refresh cookie)
- `POST /api/auth/refresh` - Refresh access token

### Songs

- `GET /api/songs` - List songs
- `POST /api/upload/init` - Get signed upload URL
- `POST /api/upload/complete` - Trigger transcoding
- `GET /api/stream/:songId?quality=preview|64|128` - Get playback URL

### Admin

- `GET /api/admin/uploads/pending` - List pending uploads
- `POST /api/admin/songs/:id/moderate` - Approve/reject song

## Development Roadmap

### Phase 1: Foundation ✅

- [x] Repo scaffold
- [x] Database schema
- [x] Docker environment

### Phase 2: Backend Core (Current)

- [ ] Auth endpoints (signup/login/refresh)
- [ ] JWT middleware
- [ ] Upload signed URL endpoint

### Phase 3: Transcoding

- [ ] BullMQ worker setup
- [ ] FFmpeg integration
- [ ] S3 upload/download

### Phase 4: Frontend

- [ ] Auth pages
- [ ] Upload form
- [ ] Global player component

### Phase 5: Admin & Polish

- [ ] Admin dashboard
- [ ] Moderation flow
- [ ] CI/CD pipeline

## Documentation

See `/docs` folder for detailed architecture:

- `PRODUCTION_ARCHITECTURE.md` - System design
- `DATABASE_SCHEMA.md` - DB structure
- `TRANSCODING_PIPELINE.md` - Worker flow
- `AUTH_SECURITY_PLAN.md` - Security design
