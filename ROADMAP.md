# Project Roadmap

## Phase 1: Foundation & Scaffolding

- [x] **Requirements & Data Model** (Schema Design)
- [x] **Monorepo Setup** (Frontend/Backend/Infra)
- [x] **Docker Environment** (Postgres, Redis, MinIO)
- [x] **Database Schema** (Prisma definitions)

## Phase 2: Backend Core & Auth

- [ ] **API Skeleton** (Express app, Logger, Error Handler)
- [ ] **Authentication** (JWT, Refresh Token, Middleware)
- [ ] **Database Migration** (Apply Prisma schema)
- [ ] **Role-Based Access Control** (Admin/User guards)

## Phase 3: Ingestion Pipeline

- [ ] **Storage Service** (S3 Signed URLs)
- [ ] **Transcoding Worker** (BullMQ + FFmpeg setup)
- [ ] **Upload Endpoint** (Trigger ingest)
- [ ] **Worker Logic** (Generate 128k/64k/Preview)

## Phase 4: Frontend Core & Player

- [ ] **UI Scaffold** (Layout, Header, Sidebar)
- [ ] **Auth Pages** (Login, Signup)
- [ ] **Music Player Bar** (Global state, Audio API)
- [ ] **Media Session** (Keyboard/Lockscreen controls)

## Phase 5: Discovery & Features

- [ ] **Search Engine** (Backend query, Frontend UI)
- [ ] **Library & Playlists** (CRUD operations)
- [ ] **YouTube Integration** (Metadata fetcher)

## Phase 6: Admin & Moderation

- [ ] **Admin Dashboard** (Stats, User management)
- [ ] **Moderation Workflow** (Approve/Reject uploads)
- [ ] **Analytics** (Plays tracking)

## Phase 7: DevOps & Polish

- [ ] **CI/CD** (GitHub Actions)
- [ ] **Monitoring** (Sentry, Prometheus)
- [ ] **Deployment** (Container build, Cloud Run)
