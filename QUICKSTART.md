# Quick Start Guide

## Prerequisites

- Docker Desktop (running)
- Node.js 20+
- Git

## 1. Clone & Setup

```bash
git clone <your-repo-url>
cd sangtamizh-music
cp .env.example .env
```

Edit `.env` if needed (defaults work for local dev).

## 2. Start Infrastructure

```bash
# Start Postgres, Redis, MinIO
docker-compose up -d postgres redis minio createbuckets

# Verify containers are running
docker ps
```

## 3. Setup Backend

```bash
cd backend
npm install

# Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev --name init

# Start backend server
npm run dev
```

Backend will run on **http://localhost:4000**

## 4. Setup Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on **http://localhost:5173**

## 5. Test the MVP Flow

### A. Create an account

1. Open http://localhost:5173
2. Navigate to Signup
3. Create a user account

### B. Upload a song

1. Login with your credentials
2. Go to Upload page
3. Fill in title, artist, and select an MP3 file
4. Click Upload
5. Wait for "Processing..." message

### C. Check transcoding

The worker will process the file in the background. Check backend logs:

```bash
# In backend terminal, you should see:
# "Processing transcode job..."
# "Running FFmpeg..."
# "✓ Transcode complete"
```

### D. Play the preview

1. Go to Library/Home
2. Click on your uploaded song
3. Preview should play in the bottom player bar

## Troubleshooting

### Docker not starting

```bash
# Check if Docker Desktop is running
docker ps

# If not, start Docker Desktop and wait for it to be ready
```

### Database connection error

```bash
# Ensure Postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres
```

### MinIO bucket not created

```bash
# Recreate the bucket
docker-compose up createbuckets
```

### Port already in use

```bash
# Backend (4000)
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Frontend (5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## Development Workflow

### Run everything with Docker

```bash
docker-compose up --build
```

### Run backend worker separately

```bash
cd backend
npm run worker
```

### Reset database

```bash
cd backend
npx prisma migrate reset
```

### View database

```bash
cd backend
npx prisma studio
```

Opens Prisma Studio on http://localhost:5555

## API Endpoints

### Auth

- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Upload

- `POST /api/upload/init` - Get signed upload URL
- `POST /api/upload/complete` - Trigger transcoding
- `GET /api/upload/stream/:songId?quality=preview|64|128` - Get stream URL

## Next Steps

1. ✅ MVP is running!
2. Implement song listing page
3. Add admin dashboard
4. Deploy to Cloud Run (see DEPLOYMENT_PLAN.md)
