# Admin Dashboard Scaffold

**Goal**: A centralized interface for content moderation, user management, and platform analytics.

## 1. Backend Analytics Service

### `server/src/controllers/admin.controller.ts`

Aggregates data from Postgres (historical) and Redis (real-time).

```typescript
import { Request, Response } from "express";
import { db } from "../config/db"; // Prisma/TypeORM
import { redis } from "../config/redis";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Content Stats
    const songCounts = await db.song.groupBy({
      by: ["status", "moderation_status"],
      _count: true,
    });

    const pendingReview =
      songCounts.find((s) => s.moderation_status === "pending")?._count || 0;
    const totalSongs = songCounts.reduce((acc, curr) => acc + curr._count, 0);

    // 2. User Stats
    const totalUsers = await db.user.count();
    const newUsersToday = await db.user.count({
      where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });

    // 3. Playback Analytics (Aggregate from song_analytics or Redis)
    const playsToday = await db.songAnalytics.count({
      where: {
        event_type: "play",
        timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    // 4. Top Tracks (from Redis Leaderboard)
    // Key format: 'leaderboard:songs:daily:<YYYY-MM-DD>'
    const todayKey = `leaderboard:songs:daily:${
      new Date().toISOString().split("T")[0]
    }`;
    const topTrackIds = await redis.zrevrange(todayKey, 0, 9);

    // Fetch details for top tracks
    const topTracks =
      topTrackIds.length > 0
        ? await db.song.findMany({
            where: { id: { in: topTrackIds } },
            select: {
              id: true,
              title: true,
              artist: true,
              cover_image_key: true,
            },
          })
        : [];

    res.json({
      overview: {
        pendingReview,
        totalSongs,
        totalUsers,
        newUsersToday,
        playsToday,
      },
      topTracks,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

// Moderation Actions
export const moderateSong = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, reason } = req.body; // 'approve' | 'reject'

  const status = action === "approve" ? "approved" : "rejected";

  await db.song.update({
    where: { id },
    data: {
      moderation_status: status,
      rejection_reason: reason,
    },
  });

  // Notify user logic here...

  res.json({ success: true, id, status });
};
```

## 2. Frontend Components (React)

### `client/src/pages/Admin/Dashboard.tsx`

```tsx
import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Users,
  Music,
  CheckCircle,
  XCircle,
  Play,
} from "lucide-react";
import api from "../../api/axios";
import { formatNumber } from "../../utils/format";
import { Song, User } from "../../api/types";

// --- Sub-components ---

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
          {formatNumber(value)}
        </h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const PendingUploadsTable = () => {
  const queryClient = useQueryClient();
  const { data: songs, isLoading } = useQuery(["admin", "pending"], () =>
    api.get<Song[]>("/admin/uploads/pending").then((res) => res.data)
  );

  const mutation = useMutation(
    (payload: { id: string; action: "approve" | "reject" }) =>
      api.post(`/admin/songs/${payload.id}/moderate`, payload),
    {
      onSuccess: () => queryClient.invalidateQueries(["admin", "pending"]),
    }
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold">Pending Approvals</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 font-medium">
          <tr>
            <th className="p-4">Track</th>
            <th className="p-4">Artist</th>
            <th className="p-4">Uploaded</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {songs?.map((song) => (
            <tr
              key={song.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td className="p-4 flex items-center gap-3">
                <img src={song.coverUrl} className="w-10 h-10 rounded" alt="" />
                <span className="font-medium">{song.title}</span>
              </td>
              <td className="p-4 text-gray-500">{song.artist}</td>
              <td className="p-4 text-gray-500">
                {new Date(song.createdAt).toLocaleDateString()}
              </td>
              <td className="p-4 text-right space-x-2">
                <button
                  onClick={() => window.open(song.url_preview, "_blank")}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                  title="Preview"
                >
                  <Play size={16} />
                </button>
                <button
                  onClick={() =>
                    mutation.mutate({ id: song.id, action: "approve" })
                  }
                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-semibold"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    mutation.mutate({ id: song.id, action: "reject" })
                  }
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Page ---

const AdminDashboard = () => {
  const { data: stats } = useQuery(["admin", "stats"], () =>
    api.get("/admin/stats").then((res) => res.data)
  );

  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-medium">
            Live
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Plays (Today)"
          value={stats?.overview.playsToday || 0}
          icon={BarChart}
          color="bg-indigo-500"
        />
        <StatCard
          title="Pending Review"
          value={stats?.overview.pendingReview || 0}
          icon={CheckCircle}
          color="bg-orange-500"
        />
        <StatCard
          title="Active Users"
          value={stats?.overview.totalUsers || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Songs"
          value={stats?.overview.totalSongs || 0}
          icon={Music}
          color="bg-pink-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Pending List */}
        <div className="lg:col-span-2">
          <PendingUploadsTable />
        </div>

        {/* Sidebar: Top Tracks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold mb-4">Top Tracks Today</h3>
          <div className="space-y-4">
            {stats?.topTracks.map((track: any, i: number) => (
              <div key={track.id} className="flex items-center gap-3">
                <span className="text-gray-400 font-mono w-4">{i + 1}</span>
                <img
                  src={track.cover_image_key}
                  className="w-10 h-10 rounded bg-gray-100"
                />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {track.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

## 3. Waveform Preview Logic

For the "Song Detail View", use `wavesurfer.js` to render the `preview` URL.

```tsx
import WaveSurfer from "wavesurfer.js";
import { useEffect, useRef } from "react";

export const WaveformPreview = ({ url }: { url: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#4f46e5",
      progressColor: "#818cf8",
      height: 64,
      barWidth: 2,
    });

    wavesurfer.current.load(url);

    return () => wavesurfer.current?.destroy();
  }, [url]);

  return (
    <div className="p-4 bg-gray-50 rounded border">
      <div ref={containerRef} />
      <button
        onClick={() => wavesurfer.current?.playPause()}
        className="mt-2 text-sm bg-indigo-600 text-white px-3 py-1 rounded"
      >
        Play/Pause
      </button>
    </div>
  );
};
```
