# Upload & Transcoding Pipeline Architecture

## 1. Architecture Flow

This pipeline offloads the heavy ingestion bandwidth to S3 and the CPU-intensive processing to a dedicated worker service.

1.  **Request Upload**: Client requests a Pre-signed Upload URL from `API Server` (`POST /api/upload/sign`).
2.  **Direct Upload**: Client parses the URL and uploads the file directly to the S3 `raw-uploads/` bucket bucket using `PUT` request.
3.  **Confirmation**: Client notifies `API Server` that upload is complete (`POST /api/upload/complete`).
4.  **Queueing**: `API Server` verifies file existence (headObject) and pushes a `transcode_job` to the **Redis Queue** (BullMQ).
5.  **Processing**: The **Transcoding Worker** picks up the job:
    - Downloads raw file from S3.
    - Runs FFmpeg for 3 variants.
    - Uploads variants back to S3 (`processed/` folder).
6.  **Completion**: Worker updates `PostgreSQL` database status to `ready` and publishes a `job_completed` event to **Redis Pub/Sub**.
7.  **Notification**: `API Server` (listening to Pub/Sub) sends a **WebSocket** message to the user: "Your song is ready!".

---

## 2. Worker Code (TypeScript)

### `src/worker/transcoder.ts`

```typescript
import { Worker, Job } from "bullmq";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { db } from "../db"; // Prisma client
import { notifyUser } from "../services/notification"; // WebSocket helper

const s3 = new S3Client({
  /* config */
});
const REDIS_URL = process.env.REDIS_URL;
const TEMP_DIR = "/tmp/transcode";

interface TranscodeData {
  songId: string;
  rawKey: string;
  userId: string;
}

// Helper: Configure FFmpeg commands
const transcodeFile = (input: string, output: string, options: string[]) => {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions(options)
      .save(output)
      .on("end", resolve)
      .on("error", reject);
  });
};

const processJob = async (job: Job<TranscodeData>) => {
  const { songId, rawKey, userId } = job.data;
  const workDir = path.join(TEMP_DIR, job.id!);

  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  const rawFile = path.join(workDir, "raw_input");

  try {
    // 1. Download Raw File from S3
    console.log(`Downloading ${rawKey}...`);
    const s3Object = await s3.send(
      new GetObjectCommand({ Bucket: "music-bucket", Key: rawKey })
    );
    const writeStream = fs.createWriteStream(rawFile);
    // @ts-ignore - AWS SDK stream types mismatch workaround
    s3Object.Body.pipe(writeStream);
    await new Promise((resolve) => writeStream.on("finish", resolve));

    // 2. Define Output Paths
    const out128 = path.join(workDir, "128k.mp3");
    const out64 = path.join(workDir, "64k.mp3");
    const outPreview = path.join(workDir, "preview.mp3");

    // 3. Run Transcoding (Parallel Promises)
    console.log("Starting FFmpeg...");
    await Promise.all([
      // High Quality (128k)
      transcodeFile(rawFile, out128, [
        "-b:a 128k",
        "-ac 2", // Stereo
        "-f mp3",
      ]),
      // Low Quality (64k)
      transcodeFile(rawFile, out64, [
        "-b:a 64k",
        "-ac 1", // Mono for mobile/bandwidth saving
        "-f mp3",
      ]),
      // Preview (30s, Normalized)
      transcodeFile(rawFile, outPreview, [
        "-t 30", // 30 seconds
        "-b:a 128k",
        "-af loudnorm", // Loudness Normalization
        "-af afade=t=out:st=28:d=2", // Fade out last 2 seconds
        "-f mp3",
      ]),
    ]);

    // 4. Upload Variants to S3
    const uploadVariant = async (filePath: string, suffix: string) => {
      const key = `processed/${songId}/${suffix}.mp3`;
      const fileStream = fs.createReadStream(filePath);
      await s3.send(
        new PutObjectCommand({
          Bucket: "music-bucket",
          Key: key,
          Body: fileStream,
          ContentType: "audio/mpeg",
        })
      );
      return key;
    };

    const [key128, key64, keyPreview] = await Promise.all([
      uploadVariant(out128, "128kbps"),
      uploadVariant(out64, "64kbps"),
      uploadVariant(outPreview, "preview"),
    ]);

    // 5. Update DB
    await db.song.update({
      where: { id: songId },
      data: {
        status: "READY",
        storage_keys: {
          high: key128,
          low: key64,
          preview: keyPreview,
        },
      },
    });

    // 6. Notify User
    await notifyUser(userId, { type: "SONG_READY", songId });
  } catch (error) {
    console.error("Transcoding failed:", error);
    await db.song.update({ where: { id: songId }, data: { status: "FAILED" } });
    throw error;
  } finally {
    // Cleanup Temp Files
    fs.rmSync(workDir, { recursive: true, force: true });
  }
};

new Worker("transcode-queue", processJob, {
  connection: { url: REDIS_URL },
  concurrency: 2, // Number of parallel jobs per worker
});
```

## 3. Worker Dockerfile

We need a lightweight Node.js image that includes `ffmpeg`.

```dockerfile
# Base Stage
FROM node:20-alpine AS base

# Install FFmpeg (and python/make for building node modules if needed)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Build Stage
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM base
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Start the Worker
CMD ["node", "dist/worker/transcoder.js"]
```

# Upload & Transcoding Pipeline Architecture

## 1. Architecture Flow

This pipeline offloads the heavy ingestion bandwidth to S3 and the CPU-intensive processing to a dedicated worker service.

1.  **Request Upload**: Client requests a Pre-signed Upload URL from `API Server` (`POST /api/upload/sign`).
2.  **Direct Upload**: Client parses the URL and uploads the file directly to the S3 `raw-uploads/` bucket bucket using `PUT` request.
3.  **Confirmation**: Client notifies `API Server` that upload is complete (`POST /api/upload/complete`).
4.  **Queueing**: `API Server` verifies file existence (headObject) and pushes a `transcode_job` to the **Redis Queue** (BullMQ).
5.  **Processing**: The **Transcoding Worker** picks up the job:
    - Downloads raw file from S3.
    - Runs FFmpeg for 3 variants.
    - Uploads variants back to S3 (`processed/` folder).
6.  **Completion**: Worker updates `PostgreSQL` database status to `ready` and publishes a `job_completed` event to **Redis Pub/Sub**.
7.  **Notification**: `API Server` (listening to Pub/Sub) sends a **WebSocket** message to the user: "Your song is ready!".

---

## 2. Worker Code (TypeScript)

### `src/worker/transcoder.ts`

```typescript
import { Worker, Job } from "bullmq";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { db } from "../db"; // Prisma client
import { notifyUser } from "../services/notification"; // WebSocket helper

const s3 = new S3Client({
  /* config */
});
const REDIS_URL = process.env.REDIS_URL;
const TEMP_DIR = "/tmp/transcode";

interface TranscodeData {
  songId: string;
  rawKey: string;
  userId: string;
}

// Helper: Configure FFmpeg commands
const transcodeFile = (input: string, output: string, options: string[]) => {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .outputOptions(options)
      .save(output)
      .on("end", resolve)
      .on("error", reject);
  });
};

const processJob = async (job: Job<TranscodeData>) => {
  const { songId, rawKey, userId } = job.data;
  const workDir = path.join(TEMP_DIR, job.id!);

  if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

  const rawFile = path.join(workDir, "raw_input");

  try {
    // 1. Download Raw File from S3
    console.log(`Downloading ${rawKey}...`);
    const s3Object = await s3.send(
      new GetObjectCommand({ Bucket: "music-bucket", Key: rawKey })
    );
    const writeStream = fs.createWriteStream(rawFile);
    // @ts-ignore - AWS SDK stream types mismatch workaround
    s3Object.Body.pipe(writeStream);
    await new Promise((resolve) => writeStream.on("finish", resolve));

    // 2. Define Output Paths
    const out128 = path.join(workDir, "128k.mp3");
    const out64 = path.join(workDir, "64k.mp3");
    const outPreview = path.join(workDir, "preview.mp3");

    // 3. Run Transcoding (Parallel Promises)
    console.log("Starting FFmpeg...");
    await Promise.all([
      // High Quality (128k)
      transcodeFile(rawFile, out128, [
        "-b:a 128k",
        "-ac 2", // Stereo
        "-f mp3",
      ]),
      // Low Quality (64k)
      transcodeFile(rawFile, out64, [
        "-b:a 64k",
        "-ac 1", // Mono for mobile/bandwidth saving
        "-f mp3",
      ]),
      // Preview (30s, Normalized)
      transcodeFile(rawFile, outPreview, [
        "-t 30", // 30 seconds
        "-b:a 128k",
        "-af loudnorm", // Loudness Normalization
        "-af afade=t=out:st=28:d=2", // Fade out last 2 seconds
        "-f mp3",
      ]),
    ]);

    // 4. Upload Variants to S3
    const uploadVariant = async (filePath: string, suffix: string) => {
      const key = `processed/${songId}/${suffix}.mp3`;
      const fileStream = fs.createReadStream(filePath);
      await s3.send(
        new PutObjectCommand({
          Bucket: "music-bucket",
          Key: key,
          Body: fileStream,
          ContentType: "audio/mpeg",
        })
      );
      return key;
    };

    const [key128, key64, keyPreview] = await Promise.all([
      uploadVariant(out128, "128kbps"),
      uploadVariant(out64, "64kbps"),
      uploadVariant(outPreview, "preview"),
    ]);

    // 5. Update DB
    await db.song.update({
      where: { id: songId },
      data: {
        status: "READY",
        storage_keys: {
          high: key128,
          low: key64,
          preview: keyPreview,
        },
      },
    });

    // 6. Notify User
    await notifyUser(userId, { type: "SONG_READY", songId });
  } catch (error) {
    console.error("Transcoding failed:", error);
    await db.song.update({ where: { id: songId }, data: { status: "FAILED" } });
    throw error;
  } finally {
    // Cleanup Temp Files
    fs.rmSync(workDir, { recursive: true, force: true });
  }
};

new Worker("transcode-queue", processJob, {
  connection: { url: REDIS_URL },
  concurrency: 2, // Number of parallel jobs per worker
});
```

## 3. Worker Dockerfile

We need a lightweight Node.js image that includes `ffmpeg`.

```dockerfile
# Base Stage
FROM node:20-alpine AS base

# Install FFmpeg (and python/make for building node modules if needed)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Build Stage
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM base
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Start the Worker
CMD ["node", "dist/worker/transcoder.js"]
```

## 4. FFmpeg Command Explained

Here are the raw commands the worker constructs:

**1. High Quality (128kbps)**

```bash
ffmpeg -i input.mp3 -b:a 128k -vn -y output_128.mp3
```

- `-vn`: Strip video (album art).
- `-y`: Overwrite output.

**2. Mobile Quality (64kbps)**

```bash
ffmpeg -i input.mp3 -b:a 64k -vn -y output_64.mp3
```

**3. Preview Clip (30s)**

```bash
ffmpeg -ss 00:00:00 -t 30 -i input.mp3 -b:a 128k -vn -y preview_30s.mp3
```

- `-ss 00:00:00`: Seek to start (robustness).
- `-t 30`: Duration.
