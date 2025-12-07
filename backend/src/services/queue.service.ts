import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const transcodeQueue = new Queue('transcode', { connection });

interface TranscodeJobData {
  songId: string;
  uploadId: string;
  storageKey: string;
}

export async function enqueueTranscodeJob(data: TranscodeJobData) {
  const job = await transcodeQueue.add('transcode-song', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  console.log(`Enqueued transcode job ${job.id} for song ${data.songId}`);
  return job;
}

export { transcodeQueue };
