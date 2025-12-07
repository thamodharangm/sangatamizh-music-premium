import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { getSignedPutUrl, getSignedGetUrl } from '../services/s3.service';
import { enqueueTranscodeJob } from '../services/queue.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Init upload: create DB entry and return signed PUT URL
router.post('/init', authenticate, async (req: Request, res: Response) => {
  try {
    const { title, artist, filename, contentType } = req.body;
    const userId = (req as any).user.id;

    if (!title || !filename || !contentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create upload record
    const uploadId = uuidv4();
    const storageKey = `uploads/${uploadId}/${filename}`;

    const upload = await prisma.upload.create({
      data: {
        id: uploadId,
        userId,
        fileName: filename,
        originalSize: 0, // Will be updated on complete
        mimeType: contentType,
        status: 'pending',
      },
    });

    // Create song record
    const song = await prisma.song.create({
      data: {
        title,
        artist: artist || 'Unknown Artist',
        uploaderId: userId,
        status: 'uploaded',
        moderationStatus: 'pending',
      },
    });

    // Update upload with song reference
    await prisma.upload.update({
      where: { id: uploadId },
      data: { jobId: song.id },
    });

    // Generate signed PUT URL
    const signedUrl = await getSignedPutUrl(storageKey, contentType);

    res.json({
      uploadId,
      songId: song.id,
      signedUrl,
      storageKey,
    });
  } catch (error) {
    console.error('Upload init error:', error);
    res.status(500).json({ error: 'Failed to initialize upload' });
  }
});

// Complete: mark DB entry and enqueue transcode job
router.post('/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.body;

    if (!uploadId) {
      return res.status(400).json({ error: 'Missing uploadId' });
    }

    // Find upload
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Update upload status
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'uploaded' },
    });

    // Update song status
    if (upload.jobId) {
      await prisma.song.update({
        where: { id: upload.jobId },
        data: { status: 'processing' },
      });

      // Enqueue transcode job
      await enqueueTranscodeJob({
        songId: upload.jobId,
        uploadId: upload.id,
        storageKey: `uploads/${uploadId}/${upload.fileName}`,
      });
    }

    res.json({ ok: true, message: 'Upload complete, processing started' });
  } catch (error) {
    console.error('Upload complete error:', error);
    res.status(500).json({ error: 'Failed to complete upload' });
  }
});

// Stream: return signed GET URL for requested quality
router.get('/stream/:songId', async (req: Request, res: Response) => {
  try {
    const { songId } = req.params;
    const quality = (req.query.quality as string) || 'preview';

    // Find song
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    if (song.status !== 'ready') {
      return res.status(400).json({ error: 'Song not ready for streaming' });
    }

    // Get storage key from song metadata
    const storageKeys = song.storageKeys as any;
    let storageKey: string;

    switch (quality) {
      case '128':
        storageKey = storageKeys?.high;
        break;
      case '64':
        storageKey = storageKeys?.low;
        break;
      case 'preview':
      default:
        storageKey = storageKeys?.preview;
    }

    if (!storageKey) {
      return res.status(404).json({ error: 'Quality variant not available' });
    }

    // Generate signed GET URL
    const url = await getSignedGetUrl(storageKey);

    res.json({
      url,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to get stream URL' });
  }
});

export default router;
