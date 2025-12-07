# 🔧 Common Issues & Fixes

## ❌ Error 1: Audio Not Streaming

### Symptoms

- Player shows "loading" but never plays
- Network tab shows 403/404 on audio URL
- CORS errors in console

### Root Causes & Fixes

#### A. Storage file not public

```typescript
// ❌ WRONG: Direct S3 URL without signing
const url = `https://bucket.s3.amazonaws.com/song.mp3`;

// ✅ CORRECT: Use signed URLs
import { getSignedGetUrl } from "../services/s3.service";
const url = await getSignedGetUrl("songs/123/preview.mp3");
```

#### B. CORS not configured

```bash
# For S3
aws s3api put-bucket-cors --bucket YOUR_BUCKET --cors-configuration file://cors.json

# cors.json
{
  "CORSRules": [{
    "AllowedOrigins": ["https://your-frontend.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }]
}

# For GCS
gsutil cors set cors.json gs://YOUR_BUCKET
```

#### C. Signed URL expired

```typescript
// Increase expiry time
export async function getSignedGetUrl(key: string): Promise<string> {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Expires: 60 * 60, // ✅ 1 hour instead of 10 minutes
  };
  return s3.getSignedUrlPromise("getObject", params);
}
```

---

## ❌ Error 2: Upload Working But No MP3_128/64

### Symptoms

- Upload completes successfully
- Song status stuck on "processing"
- No transcoded files in storage

### Root Causes & Fixes

#### A. Worker not running

```bash
# Check if worker is running
docker-compose ps worker

# If not, start it
docker-compose up -d worker

# View worker logs
docker-compose logs -f worker

# For Cloud Run Jobs
gcloud run jobs execute music-worker --region=asia-south1
```

#### B. FFmpeg not installed

```dockerfile
# ✅ Ensure Dockerfile includes FFmpeg
FROM node:20-alpine
RUN apk add --no-cache ffmpeg  # ← This line is critical
```

#### C. Redis connection failed

```typescript
// Add connection error handling
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

connection.on("error", (err) => {
  console.error("Redis connection error:", err);
});
```

#### D. Job queue not processing

```typescript
// Check queue health
import { Queue } from "bullmq";

const queue = new Queue("transcode", { connection });

// Get queue stats
const counts = await queue.getJobCounts();
console.log("Queue stats:", counts);
// { waiting: 5, active: 2, completed: 10, failed: 1 }

// Retry failed jobs
const failed = await queue.getFailed();
for (const job of failed) {
  await job.retry();
}
```

---

## ❌ Error 3: CORS Blocked

### Symptoms

```
Access to fetch at 'http://localhost:4000/api/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

### Fix

```typescript
// backend/src/index.ts
import cors from "cors";

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend.web.app", "https://your-domain.com"]
        : ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // ← Important for cookies
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight
app.options("*", cors());
```

---

## ❌ Error 4: YouTube API 403 / Quota Exceeded

### Symptoms

- YouTube search returns 403
- Error: "quotaExceeded"

### Fixes

#### A. API Key not enabled

```bash
# Enable YouTube Data API v3
gcloud services enable youtube.googleapis.com

# Or in Google Cloud Console:
# APIs & Services → Library → YouTube Data API v3 → Enable
```

#### B. API Key restrictions

```typescript
// ❌ WRONG: Client-side API key
const API_KEY = "exposed-in-frontend"; // Never do this!

// ✅ CORRECT: Server-side only
// backend/src/services/youtube.service.ts
import { google } from "googleapis";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY, // Server-side env var
});
```

#### C. Quota exceeded - Use caching

```typescript
import { redis } from "../config/redis";

export async function searchVideos(query: string) {
  const cacheKey = `yt:search:${query}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Call API
  const response = await youtube.search.list({
    part: ["snippet"],
    q: query,
    maxResults: 10,
  });

  // Cache for 24 hours
  await redis.set(cacheKey, JSON.stringify(response.data), "EX", 86400);

  return response.data;
}
```

---

## ❌ Error 5: Firebase/Storage Permission Denied

### Symptoms

- Upload fails with 403
- "Permission denied" in storage

### Fix for Firebase Storage

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read for all
    match /{allPaths=**} {
      allow read: if true;
    }

    // Allow write only for authenticated users
    match /uploads/{userId}/{fileName} {
      allow write: if request.auth != null
                   && request.auth.uid == userId;
    }

    // Only workers can write to processed/
    match /songs/{songId}/{quality} {
      allow write: if false; // Only backend service account
    }
  }
}
```

### Fix for S3

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET/songs/*"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:user/backend-service"
      },
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET/*"
    }
  ]
}
```

---

## ❌ Error 6: Database Connection Failed

### Symptoms

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

### Fixes

#### A. Check connection string

```bash
# ❌ WRONG
DATABASE_URL=postgres://user:pass@localhost:5432/db

# ✅ CORRECT (Docker)
DATABASE_URL=postgresql://user:password@postgres:5432/music_db

# ✅ CORRECT (Cloud SQL with proxy)
DATABASE_URL=postgresql://user:pass@/db?host=/cloudsql/PROJECT:REGION:INSTANCE
```

#### B. Prisma connection pooling

```typescript
// backend/src/db/prisma.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

// Connection pool settings
export const prismaOptions = {
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
  },
};

export default prisma;
```

---

## ❌ Error 7: Memory Limit Exceeded (Worker)

### Symptoms

- Worker crashes during transcoding
- "JavaScript heap out of memory"

### Fixes

#### A. Increase Node memory

```json
// package.json
{
  "scripts": {
    "worker": "node --max-old-space-size=4096 dist/workers/transcode.worker.js"
  }
}
```

#### B. Process files in chunks

```typescript
// Don't load entire file into memory
import { createReadStream, createWriteStream } from "fs";

async function transcodeWithStreaming(input: string, output: string) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions(["-b:a", "128k", "-vn"])
      .pipe(createWriteStream(output))
      .on("finish", resolve)
      .on("error", reject);
  });
}
```

#### C. Increase container memory

```bash
# Cloud Run
gcloud run services update music-worker \
  --memory=4Gi \
  --cpu=2

# Docker Compose
services:
  worker:
    deploy:
      resources:
        limits:
          memory: 4G
```

---

## ❌ Error 8: JWT Token Invalid/Expired

### Symptoms

- Constant 401 errors
- User logged out frequently

### Fixes

```typescript
// Implement token refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        const { data } = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        // Update token
        localStorage.setItem("accessToken", data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // Retry original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 🔍 Debugging Checklist

When something breaks:

1. **Check logs**

   ```bash
   # Docker
   docker-compose logs -f service-name

   # Cloud Run
   gcloud logging read "resource.type=cloud_run_revision" --limit 50
   ```

2. **Verify environment variables**

   ```bash
   # In container
   docker exec -it container-name env

   # Cloud Run
   gcloud run services describe SERVICE --format="value(spec.template.spec.containers[0].env)"
   ```

3. **Test connectivity**

   ```bash
   # Database
   docker exec -it postgres-container psql -U user -d db

   # Redis
   docker exec -it redis-container redis-cli ping

   # S3
   aws s3 ls s3://bucket-name
   ```

4. **Check resource usage**

   ```bash
   docker stats
   ```

5. **Validate API responses**
   ```bash
   curl -v http://localhost:4000/health
   ```
