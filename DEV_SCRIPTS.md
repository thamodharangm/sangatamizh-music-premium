# Development Helper Scripts

## Start Everything (Recommended)

### Option 1: Docker Compose (Full Stack)

```bash
docker-compose up --build
```

### Option 2: Local Development

```bash
# Terminal 1: Infrastructure
docker-compose up -d postgres redis minio

# Terminal 2: Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Terminal 3: Worker (Optional - for transcoding)
cd backend
npm run worker

# Terminal 4: Frontend
cd frontend
npm install
npm run dev
```

## Useful Commands

### Database

```bash
# Reset database
cd backend
npx prisma migrate reset

# View database in browser
npx prisma studio

# Create new migration
npx prisma migrate dev --name <migration-name>
```

### Docker

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Restart a service
docker-compose restart backend

# Stop everything
docker-compose down

# Remove volumes (fresh start)
docker-compose down -v
```

### Testing Uploads

```bash
# Test S3 connection
docker exec -it music-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it music-minio mc ls local/music-bucket

# Test Redis connection
docker exec -it music-redis redis-cli ping
```

### API Testing

```bash
# Health check
curl http://localhost:4000/health

# Signup
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## Troubleshooting

### "Port already in use"

```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

### "Cannot connect to database"

```bash
# Check if Postgres is running
docker-compose ps postgres

# View Postgres logs
docker-compose logs postgres

# Restart Postgres
docker-compose restart postgres
```

### "Prisma Client not generated"

```bash
cd backend
npx prisma generate
```

### "FFmpeg not found" (Worker)

```bash
# Use Docker for worker
docker-compose up worker

# Or install FFmpeg locally
# Windows: choco install ffmpeg
# Mac: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key variables:

- `DATABASE_URL` - Postgres connection
- `REDIS_URL` - Redis connection
- `S3_ENDPOINT` - MinIO/S3 endpoint
- `JWT_ACCESS_SECRET` - Change in production!
- `JWT_REFRESH_SECRET` - Change in production!
