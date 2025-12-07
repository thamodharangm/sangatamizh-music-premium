import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { downloadFile, uploadFile } from '../services/s3.service';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

interface TranscodeJobData {
  songId: string;
  uploadId: string;
  storageKey: string;
}

const TEMP_DIR = '/tmp/transcode';

async function processTranscode(job: Job<TranscodeJobData>) {
  const { songId, uploadId, storageKey } = job.data;
  console.log(`Processing transcode job ${job.id} for song ${songId}`);

  const workDir = path.join(TEMP_DIR, job.id!);
  await fs.mkdir(workDir, { recursive: true });

  try {
    // 1. Download original file from S3
    console.log(`Downloading ${storageKey}...`);
    const inputBuffer = await downloadFile(storageKey);
    const inputPath = path.join(workDir, 'input.mp3');
    await fs.writeFile(inputPath, inputBuffer);

    // 2. Define output paths
    const output128 = path.join(workDir, '128k.mp3');
    const output64 = path.join(workDir, '64k.mp3');
    const outputPreview = path.join(workDir, 'preview.mp3');

    // 3. Run FFmpeg transcoding
    console.log('Running FFmpeg...');
    
    await Promise.all([
      // High quality (128kbps)
      execAsync(`ffmpeg -i "${inputPath}" -b:a 128k -vn -y "${output128}"`),
      // Low quality (64kbps)
      execAsync(`ffmpeg -i "${inputPath}" -b:a 64k -vn -y "${output64}"`),
      // Preview (30s)
      execAsync(`ffmpeg -ss 00:00:00 -t 30 -i "${inputPath}" -b:a 128k -vn -y "${outputPreview}"`),
    ]);

    // 4. Upload variants to S3
    console.log('Uploading variants...');
    const [buffer128, buffer64, bufferPreview] = await Promise.all([
      fs.readFile(output128),
      fs.readFile(output64),
      fs.readFile(outputPreview),
    ]);

    const key128 = `songs/${songId}/128k.mp3`;
    const key64 = `songs/${songId}/64k.mp3`;
    const keyPreview = `songs/${songId}/preview.mp3`;

    await Promise.all([
      uploadFile(key128, buffer128, 'audio/mpeg'),
      uploadFile(key64, buffer64, 'audio/mpeg'),
      uploadFile(keyPreview, bufferPreview, 'audio/mpeg'),
    ]);

    // 5. Update database
    await prisma.song.update({
      where: { id: songId },
      data: {
        status: 'ready',
        storageKeys: {
          high: key128,
          low: key64,
          preview: keyPreview,
        },
      },
    });

    console.log(`✓ Transcode complete for song ${songId}`);
  } catch (error) {
    console.error(`✗ Transcode failed for song ${songId}:`, error);
    
    // Update song status to failed
    await prisma.song.update({
      where: { id: songId },
      data: { status: 'failed' },
    });

    throw error;
  } finally {
    // Cleanup temp files
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

// Create worker
const worker = new Worker('transcode', processTranscode, {
  connection,
  concurrency: 2,
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('🎵 Transcode worker started');

export default worker;
