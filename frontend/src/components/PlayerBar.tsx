import React, { useEffect, useRef, useState } from 'react';

type Props = { 
  src?: string; 
  title?: string;
  artist?: string;
};

export default function PlayerBar({ src, title, artist }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    audio.onended = () => setPlaying(false);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () => setDuration(audio.duration);

    // Media Session API
    if ('mediaSession' in navigator && title) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: artist || 'Unknown Artist',
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audio.play();
        setPlaying(true);
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
        setPlaying(false);
      });
    }
  }, [title, artist]);

  useEffect(() => {
    if (!audioRef.current || !src) return;
    audioRef.current.src = src;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!src) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 text-white border-t border-gray-700 z-50">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{title || 'No track'}</div>
          {artist && <div className="text-sm text-gray-400 truncate">{artist}</div>}
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              if (audioRef.current) {
                audioRef.current.currentTime = Number(e.target.value);
              }
            }}
            className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-400">{formatTime(duration)}</span>
        </div>

        <button
          onClick={togglePlay}
          className="px-6 py-2 rounded-full bg-white text-black font-semibold hover:scale-105 transition"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}
