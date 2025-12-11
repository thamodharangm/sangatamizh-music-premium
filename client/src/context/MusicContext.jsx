import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const { user, updateStats } = useAuth();
  
  // Audio & Queue State
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Time State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    // Auto-play next song
    const handleEnded = () => {
      setIsPlaying(false);
      if (updateStats) updateStats('song_played');
      nextSong();
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [queue, currentIndex]); // Re-bind if playlist changes to ensure fresh state access? Actually handleEnded relies on closing over 'queue' if defined inside. 
  // BETTER: Move nextSong logic into handleEnded or use functional state updates.
  // Actually, let's keep it simple. Accessing 'nextSong' from closure might be stale.
  // let's define nextSong via ref or just use state in handleEnded? 
  // To avoid stale closures, let's rely on currentIndex state in the helper functions, 
  // but useEffect runs only on mount. 
  // FIX: Provide dependencies to useEffect? No, easier to just access state via refs or helper functions that are stable...
  // ACTUALLY: Let's make nextSong NOT depend on the closure by updating the Queue management slightly.

  // Helper to ensure nextSong works inside event listener
  // We need to use a Ref to access the latest queue/index inside the event listener without re-attaching listeners constantly
  const queueRef = useRef([]);
  const indexRef = useRef(-1);

  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
  }, [queue, currentIndex]);

  const nextSong = () => {
    const q = queueRef.current;
    const idx = indexRef.current;
    if (q.length === 0) return;

    if (idx < q.length - 1) {
      const newIndex = idx + 1;
      const song = q[newIndex];
      playAtIndex(newIndex, song);
    } else {
      // End of playlist - Stop or Loop? Let's stops for now.
      setIsPlaying(false);
    }
  };

  const prevSong = () => {
    const index = indexRef.current;
    if (index > 0) {
      const newIndex = index - 1;
      const song = queueRef.current[newIndex];
      playAtIndex(newIndex, song);
    } else {
      // Restart song
      audioRef.current.currentTime = 0;
    }
  };

  // Internal helper to play specific index without recreating queue
  const playAtIndex = (index, song) => {
    setCurrentIndex(index);
    setCurrentSong(song);
  };

  // Re-attach 'ended' listener correctly? 
  // Actually, we can just call nextSong() inside the effect and nextSong uses the Refs.
  
  // Watch currentSong changes to play audio
  useEffect(() => {
    const audio = audioRef.current;
    if (currentSong) {
      // Only change src if it's different to support resuming or seeking without reload? 
      // Actually for a new song object, it's always new.
      if (audio.src !== currentSong.audioUrl) {
         audio.src = currentSong.audioUrl;
         audio.play().catch(e => console.error("Play error:", e));
      } else {
         if (audio.paused) audio.play().catch(console.error);
      }
    }
  }, [currentSong]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio.paused) audio.play().catch(console.error);
    else audio.pause();
  };

  const seek = (time) => {
    const audio = audioRef.current;
    audio.currentTime = time;
  };

  // playSong now accepts an entire list (from Home/Library)
  const playSong = (song, songList = []) => {
    // --- 1-Song Limit Logic ---
    // --- Strict Auth Check ---
    // If not logged in, BLOCK PLAYBACK immediately.
    if (!user) {
        // Option: Show a nice modal/alert before redirect?
        // For now, consistent with request: force login immediately.
        window.location.href = '/login';
        return;
    }
    // --------------------------
    // --------------------------

    let newQueue = songList.length > 0 ? songList : [song];
    let newIndex = newQueue.findIndex(s => s.id === song.id);
    
    if (newIndex === -1 && songList.length > 0) {
        // Didnt find song in list? Add it? Or just play it alone.
        newQueue = [song];
        newIndex = 0;
    } 
    // If no list provided but playing same song?
    if (songList.length === 0 && currentSong?.id === song.id) {
        togglePlay();
        return;
    }

    setQueue(newQueue);
    playAtIndex(newIndex, song);
  };

  return (
    <MusicContext.Provider value={{ 
      currentSong, 
      isPlaying, 
      playSong, 
      togglePlay, 
      nextSong, 
      prevSong,
      currentTime,
      duration,
      seek 
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
