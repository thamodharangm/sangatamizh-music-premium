# YouTube Integration: Metadata & Search

**Goal**: Allow Admins to search YouTube and import metadata (Title, Artist, Duration, Thumbnail) to link or process content.
**Compliance**: Server-side API Key usage (never exposed to client). Caching to minimize API quota usage.

## 1. Backend Service (`server/src/services/youtube.service.ts`)

Uses `googleapis` and Redis for caching.

```typescript
import { google } from "googleapis";
import { redis } from "../config/redis"; // Redis client wrapper
import { env } from "../config/env";

const youtube = google.youtube({
  version: "v3",
  auth: env.YOUTUBE_API_KEY,
});

const CACHE_TTL = 3600 * 24; // 24 Hours

export const searchVideos = async (query: string): Promise<any[]> => {
  const cacheKey = `yt:search:${Buffer.from(query).toString("base64")}`;

  // 1. Check Cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 2. Call API
  const response = await youtube.search.list({
    part: ["snippet"],
    q: query,
    type: ["video"],
    videoCategoryId: "10", // Music
    maxResults: 10,
  });

  const results =
    response.data.items?.map((item) => ({
      youtubeId: item.id?.videoId,
      title: item.snippet?.title,
      channel: item.snippet?.channelTitle,
      thumbnail: item.snippet?.thumbnails?.high?.url,
    })) || [];

  // 3. Cache Result
  await redis.set(cacheKey, JSON.stringify(results), "EX", 3600); // 1 hour for search

  return results;
};

export const getVideoMetadata = async (videoId: string) => {
  const cacheKey = `yt:video:${videoId}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await youtube.videos.list({
    part: ["snippet", "contentDetails"],
    id: [videoId],
  });

  const item = response.data.items?.[0];
  if (!item) throw new Error("Video not found");

  // Parse Duration (ISO 8601) to Seconds (You'd need a helper for this usually)
  // const durationSecs = parseDuration(item.contentDetails?.duration);

  const metadata = {
    youtubeId: item.id,
    title: item.snippet?.title,
    artist: item.snippet?.channelTitle, // Best guess for artist
    description: item.snippet?.description,
    durationISO: item.contentDetails?.duration,
    tags: item.snippet?.tags,
    thumbnails: item.snippet?.thumbnails,
  };

  await redis.set(cacheKey, JSON.stringify(metadata), "EX", CACHE_TTL);

  return metadata;
};
```

## 2. API Endpoints (`server/src/routes/external.routes.ts`)

Includes Rate Limiting to protect quota.

```typescript
import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as YouTubeController from "../controllers/external.controller";
import { isAdmin } from "../middleware/permissions";

const router = Router();

// Rate Limit: 10 searches per minute per user
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many YouTube searches, please wait.",
});

// Search Endpoint (Admin Only)
router.get(
  "/youtube/search",
  isAdmin,
  searchLimiter,
  async (req, res, next) => {
    try {
      const { q } = req.query;
      if (typeof q !== "string")
        return res.status(400).json({ error: "Query required" });

      const results = await YouTubeController.search(q);
      res.json(results);
    } catch (err) {
      next(err);
    }
  }
);

// Metadata Import Endpoint
router.get("/youtube/meta/:videoId", isAdmin, async (req, res, next) => {
  try {
    const meta = await YouTubeController.getMeta(req.params.videoId);
    res.json(meta);
  } catch (err) {
    next(err);
  }
});

export default router;
```

## 3. Frontend Search UI (`client/src/components/admin/YouTubeSearch.tsx`)

```tsx
import React, { useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import api from "../../api/axios";
import { Loader2, Plus } from "lucide-react";

interface YouTubeResult {
  youtubeId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export const YouTubeSearch: React.FC<{
  onSelect: (video: YouTubeResult) => void;
}> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  // Trigger search on debounce
  React.useEffect(() => {
    if (!debouncedQuery) return;

    const search = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/external/youtube/search", {
          params: { q: debouncedQuery },
        });
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [debouncedQuery]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Import from YouTube</h3>

      <input
        type="text"
        placeholder="Search for a song..."
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 mb-4"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin" />
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {results.map((video) => (
          <div
            key={video.youtubeId}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded group"
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-16 h-12 object-cover rounded"
            />
            <div className="flex-1 overflow-hidden">
              <p className="font-medium truncate text-sm">{video.title}</p>
              <p className="text-xs text-gray-500">{video.channel}</p>
            </div>
            <button
              onClick={() => onSelect(video)}
              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition"
            >
              Import
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 4. Quota & Caching Strategy

The YouTube Data API has a daily quota (usually 10,000 units).

- **Search Cost**: 100 units (Expensive!)
- **Videos.list Cost**: 1 unit (Cheap)

**Strategy**:

1.  **Aggressive Caching**: Cache all Search results for 1 hour. Cache exact Video Metadata for 24+ hours.
2.  **Rate Limiting**: Strictly limit `search` endpoint to avoid draining quota via abuse.
3.  **Search Optimization**: If the admin pastes a direct URL/ID, skip the `search` endpoint and call `videos.list` (1 unit) directly.
