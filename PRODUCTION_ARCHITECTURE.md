# Production Music Streaming App - Architecture & Scaffold

**Tech Stack**:

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Caching**: Redis
- **Storage**: S3-compatible (MinIO for dev / AWS S3 for prod)
- **Containerization**: Docker + Docker Compose

---

## 1. Repository Structure

```
/
├── .github/
│   └── workflows/
│       └── ci.yml
├── client/                 # React App
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── Dockerfile
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── server/                 # Express API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/         # TypeORM/Prisma entities
│   │   ├── routes/
│   │   ├── services/       # Business logic (Upload, Auth)
│   │   └── utils/
│   ├── Dockerfile
│   └── package.json
├── infra/                  # Infrastructure Config
│   ├── docker/
│   │   └── nginx.conf
│   └── k8s/ (optional)
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json            # Root workspace config
└── README.md
```

## 2. Package Scripts (Root)

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "npm run dev --prefix server",
    "dev:client": "npm run dev --prefix client",
    "build": "npm run build --prefix client && npm run build --prefix server",
    "test": "npm run test --prefix client && npm run test --prefix server",
    "lint": "eslint . --ext .ts,.tsx",
    "docker:up": "docker-compose up -d --build",
    "docker:down": "docker-compose down"
  }
}
```

## 3. Docker Configuration

**`docker-compose.yml`**:

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: music_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  minio: # S3 Simulation
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
    ports:
      - "9000:9000"
      - "9001:9001"

  server:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@postgres:5432/music_db
      - REDIS_URL=redis://redis:6379
      - S3_ENDPOINT=http://minio:9000
    depends_on:
      - postgres
      - redis
      - minio

  client:
    build:
      context: ./client
      target: development
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - server
```

## 4. GitHub Actions CI (`.github/workflows/ci.yml`)

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  build-docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Server
        run: docker build -t music-server ./server
      - name: Build Client
        run: docker build -t music-client ./client
```

## 5. Database Schema (PostgreSQL)

```sql
CREATE TYPE role_enum AS ENUM ('user', 'admin');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  role role_enum DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  duration INT, -- seconds
  cover_url VARCHAR(255),
  file_key_128 VARCHAR(255), -- S3 Key
  file_key_64 VARCHAR(255),
  file_key_preview VARCHAR(255),
  uploaded_by UUID REFERENCES users(id),
  plays BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE
);

CREATE TABLE playlist_songs (
  playlist_id UUID REFERENCES playlists(id),
  song_id UUID REFERENCES songs(id),
  order_index INT,
  PRIMARY KEY (playlist_id, song_id)
);
```

## 6. API Surface

- **Auth**
  - `POST /auth/register`
  - `POST /auth/login` (Returns Access + Refresh Token)
  - `POST /auth/refresh`
- **Songs**
  - `GET /songs` (Search/Filter)
  - `GET /songs/:id`
  - `POST /songs` (Admin: Upload Metadata + File)
  - `GET /songs/:id/stream` (Stream audio range)
- **Users**
  - `GET /users/me`
  - `GET /users/:id/playlists`

## 7. Upload & Transcoding Pipeline

1.  **Client**: Uploads raw audio file to `POST /songs/upload`.
2.  **Server (Controller)**:
    - Validates file type (flac/wav/mp3).
    - Saves raw file to temporary disk buffer.
3.  **Server (Queue/Worker)**:
    - Use `BullMQ` (Redis) to add a transcoding job.
    - **Worker Process**:
      - Input: Raw File.
      - Process 1: Convert to MP3 128kbps (Standard).
      - Process 2: Convert to MP3 64kbps (Mobile).
      - Process 3: Cut 0:00-0:30, fade out (Preview).
    - Uploads all 3 artifacts to S3 Bucket.
    - Updates `songs` table with S3 keys.
    - Deletes local raw file.

## 8. Security Checklist

- [ ] **Helmet**: Secure HTTP headers.
- [ ] **CORS**: Restrict access to frontend domain only.
- [ ] **Rate Limiting**: `express-rate-limit` on Auth/API routes.
- [ ] **Input Validation**: `zod` or `joi` for all request bodies.
- [ ] **Auth**: HttpOnly Cookies for Refresh Tokens (to prevent XSS theft).
- [ ] **Sanitization**: Prevent SQL Injection (use ORM/Params) and XSS.

## 9. Environment Variables (.env)

```ini
PORT=3000
NODE_ENV=development

# Database
DB_USER=postgres
DB_PASS=password
DB_HOST=postgres
DB_PORT=5432
DB_NAME=music_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Auth
JWT_ACCESS_SECRET=super_secret_access
JWT_REFRESH_SECRET=super_secret_refresh

# Storage (S3)
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=music-files
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

## 10. Roadmap

- **Phase 1**: Scaffold & Docker Environment (DB, Redis, Minio setup).
- **Phase 2**: Auth System (Register/Login/JWT).
- **Phase 3**: Song Upload & Transcoding Pipeline (Local storage first, then S3).
- **Phase 4**: Frontend Music Player & Library UI.
- **Phase 5**: Playlists & Interaction (Likes, Plays).
- **Phase 6**: Load Testing & Production Deployment (K8s/AWS).
