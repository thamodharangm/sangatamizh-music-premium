# Frontend Scaffold: React + Vite + TypeScript

**Tech Stack**:

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + `clsx`/`tailwind-merge`
- **State/Data**: React Query (Server state) + Zustand (Global Client state - Player)
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## 1. File Tree Structure

```
client/
├── public/
│   ├── logos/
│   └── placeholders/
├── src/
│   ├── api/
│   │   ├── axios.ts           # Axios instance with interceptors
│   │   ├── auth.service.ts    # Login, Signup, Refresh
│   │   ├── music.service.ts   # Songs, Search, Playlists
│   │   └── types.ts           # DTO Interfaces
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Input.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx     # Wrapper with PlayerBar
│   │   ├── player/
│   │   │   ├── PlayerBar.tsx
│   │   │   ├── VolumeControl.tsx
│   │   │   └── ProgressBar.tsx
│   │   └── music/
│   │       ├── SongCard.tsx
│   │       └── SongList.tsx
│   ├── context/
│   │   └── AuthContext.tsx    # Auth Provider (User session)
│   ├── hooks/
│   │   ├── usePlayer.ts       # Zustand store hook
│   │   ├── useDebounce.ts
│   │   └── useInfiniteScroll.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Search.tsx
│   │   ├── Library.tsx
│   │   ├── Upload.tsx
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   └── Admin/
│   │       └── Dashboard.tsx
│   ├── styles/
│   │   └── index.css          # Tailwind imports
│   ├── utils/
│   │   ├── formatTime.ts
│   │   └── imageProxy.ts
│   ├── App.tsx
│   └── main.tsx
├── .env
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 2. Component Code: `PlayerBar.tsx`

Handles audio playback, quality switching, and Media Session API updates.

```tsx
import React, { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../hooks/usePlayer"; // Zustand store
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
} from "lucide-react";
import { formatTime } from "../../utils/formatTime";

const PlayerBar: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentSong,
    isPlaying,
    quality,
    volume,
    togglePlay,
    nextSong,
    prevSong,
    setQuality,
  } = usePlayerStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Effect: Handle Source Changes & Quality
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const source =
      quality === "high"
        ? currentSong.url_128
        : quality === "low"
        ? currentSong.url_64
        : currentSong.url_preview;

    // Save playing position if switching quality (optional enhancement)
    const wasPlaying = !audioRef.current.paused;
    const currTime = audioRef.current.currentTime;

    audioRef.current.src = source;
    audioRef.current.currentTime = currTime;

    if (wasPlaying || isPlaying) {
      audioRef.current.play().catch((e) => console.error("Playback error:", e));
    }

    // Media Session API Support
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album,
        artwork: [
          { src: currentSong.coverUrl, sizes: "512x512", type: "image/jpeg" },
        ],
      });

      navigator.mediaSession.setActionHandler("play", togglePlay);
      navigator.mediaSession.setActionHandler("pause", togglePlay);
      navigator.mediaSession.setActionHandler("previoustrack", prevSong);
      navigator.mediaSession.setActionHandler("nexttrack", nextSong);
    }
  }, [currentSong, quality]);

  // Effect: Handle Play/Pause State
  useEffect(() => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);

  // Update Progress
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  if (!currentSong) return null; // Or return a placeholder

  return (
    <div className="fixed bottom-0 w-full h-20 bg-gray-900 border-t border-gray-800 px-4 flex items-center justify-between text-white z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextSong}
        onLoadedMetadata={handleTimeUpdate}
      />

      {/* Song Info */}
      <div className="flex items-center gap-4 w-1/4">
        <img
          src={currentSong.coverUrl}
          className="h-12 w-12 rounded bg-gray-700"
          alt="Cover"
        />
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium truncate">
            {currentSong.title}
          </span>
          <span className="text-xs text-gray-400 truncate">
            {currentSong.artist}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center w-2/4 gap-2">
        <div className="flex items-center gap-6">
          <button onClick={prevSong} className="hover:text-indigo-400">
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition"
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" ml-1 />
            )}
          </button>

          <button onClick={nextSong} className="hover:text-indigo-400">
            <SkipForward size={20} />
          </button>
        </div>

        {/* Scrubber */}
        <div className="flex items-center gap-3 w-full max-w-md text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              if (audioRef.current)
                audioRef.current.currentTime = Number(e.target.value);
            }}
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Settings */}
      <div className="flex items-center justify-end gap-3 w-1/4">
        {/* Quality Switcher */}
        <select
          value={quality}
          onChange={(e) =>
            setQuality(e.target.value as "high" | "low" | "preview")
          }
          className="bg-gray-800 text-xs border border-gray-700 rounded px-1 py-0.5"
        >
          <option value="high">HQ (128k)</option>
          <option value="low">Data Saver (64k)</option>
        </select>

        <Volume2 size={18} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) =>
            usePlayerStore.setState({ volume: Number(e.target.value) })
          }
          className="w-20 h-1 bg-gray-600 rounded-lg accent-white"
        />
      </div>
    </div>
  );
};

export default PlayerBar;
```

## 3. Page Code: `Search.tsx`

Includes debounced searching and typed API calling.

```tsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";
import { searchSongs } from "../../api/music.service";
import { Song } from "../../api/types";
import SongCard from "../../components/music/SongCard";

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (!debouncedSearch) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        // Update URL without reloading
        setSearchParams({ q: debouncedSearch });
        const data = await searchSongs(debouncedSearch);
        setResults(data);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearch, setSearchParams]);

  return (
    <div className="p-8 pt-24 min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="What do you want to listen to?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border-none rounded-full py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
            autoFocus
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Searching...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.length > 0
              ? results.map((song) => <SongCard key={song.id} song={song} />)
              : debouncedSearch && (
                  <div className="col-span-full text-center text-gray-500">
                    No results found for "{debouncedSearch}"
                  </div>
                )}
          </div>
        )}

        {!debouncedSearch && (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Browse Categories</h2>
            {/* Categories Grid Placeholder */}
            <div className="grid grid-cols-3 gap-4">
              {/* ... Category Cards */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
```
