# Backend Scaffold: Express + TypeScript + BullMQ

**Tech Stack**:

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Queue**: BullMQ (Redis)
- **Storage**: AWS S3 / MinIO
- **Validation**: Zod
- **Logging**: Winston

## 1. Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.ts             # Typed env vars
│   │   ├── logger.ts          # Winston logger
│   │   └── s3.ts              # S3 Client
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── song.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/
│   │   ├── auth.ts            # JWT Verify
│   │   ├── roles.ts           # Admin Check
│   │   ├── validate.ts        # Zod Middleware
│   │   └── error.ts           # Global Error Handler
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   └── song.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── song.service.ts
│   │   └── storage.service.ts # S3 Wrapper
│   ├── workers/
│   │   └── transcode.worker.ts
│   └── app.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

## 2. Environment Variables

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@localhost:5432/music_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret"
JWT_REFRESH_SECRET="super-refresh-secret"
S3_BUCKET="music-bucket"
S3_REGION="us-east-1"
S3_ENDPOINT="http://localhost:9000" # For MinIO
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
```

## 3. Core Components

### Storage Service (S3 Abstraction)

```typescript
// src/services/storage.service.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Needed for MinIO
});

export const uploadFile = async (
  key: string,
  body: Buffer | ReadableStream,
  mimeType: string
) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: mimeType,
    })
  );
  return key;
};

export const getSignedStreamUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });
  // Valid for 1 hour
  return getSignedUrl(s3, command, { expiresIn: 3600 });
};
```

### Transcoding Queue & Worker

```typescript
// src/workers/transcode.worker.ts
import { Worker, Job } from "bullmq";
import ffmpeg from "fluent-ffmpeg";
import { uploadFile } from "../services/storage.service";
import fs from "fs";
import path from "path";
import { logger } from "../config/logger";

const processAudio = (job: Job) => {
  const { filePath, songId, fileId } = job.data;

  // Implementation of transcoding...
  // 1. Process 128kbps
  // 2. Process 64kbps
  // 3. Process Preview
  // 4. Upload all to S3
  // 5. Update Database Record
};

export const transcodeWorker = new Worker(
  "transcode-queue",
  async (job) => {
    logger.info(`Processing job ${job.id} for song ${job.data.songId}`);
    await processAudio(job);
  },
  {
    connection: {
      url: process.env.REDIS_URL,
    },
  }
);
```

### Song Controller

```typescript
// src/controllers/song.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import { z } from 'zod';
import * as SongService from '../services/song.service';
import * as StorageService from '../services/storage.service';

const transcodeQueue = new Queue('transcode-queue', { connection: /* redis config */ });

export const uploadSong = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new Error('No file uploaded');

    // 1. Create DB Record (Status: Pending)
    const song = await SongService.createPlaceholder({
      title: req.body.title,
      artist: req.body.artist,
      uploadedBy: req.user.id
    });

    // 2. Add to Transcode Queue
    const job = await transcodeQueue.add('transcode', {
      filePath: req.file.path,
      songId: song.id,
      fileId: req.file.filename
    });

    res.status(202).json({
      message: 'Upload accepted, processing started',
      jobId: job.id,
      songId: song.id
    });
  } catch (err) {
    next(err);
  }
};

export const getStreamUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { songId } = req.params;
    const { quality } = req.query; // '128', '64', 'preview'

    const song = await SongService.findById(songId);
    if (!song) return res.status(404).json({ message: 'Song not found' });

    let s3Key;
    switch(quality) {
        case '64': s3Key = song.fileKey64; break;
        case 'preview': s3Key = song.fileKeyPreview; break;
        case '128':
        default: s3Key = song.fileKey128;
    }

    if (!s3Key) return res.status(404).json({ message: 'Quality not available' });

    // Generate Signed URL redirect
    const url = await StorageService.getSignedStreamUrl(s3Key);
    res.redirect(url); // OR return { url } for client handling
  } catch (err) {
    next(err);
  }
};
```

## 4. Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app
# Install FFmpeg
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/app.js"]
```

## 5. Logging Strategy (Winston)

```typescript
// src/config/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(), // Human readable in dev
    }),
  ],
});
```
