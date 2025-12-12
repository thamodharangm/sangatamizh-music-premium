import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../config/api';

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

  // Helper to ensure nextSong works inside event listener
  // We need to use a Ref to access the latest queue/index inside the event listener without re-attaching listeners constantly
  const queueRef = useRef([]);
  const indexRef = useRef(-1);

  useEffect(() => {
    queueRef.current = queue;
    indexRef.current = currentIndex;
  }, [queue, currentIndex]);

  // Internal helper to play specific index without recreating queue
  const playAtIndex = (index, song) => {
    setCurrentIndex(index);
    setCurrentSong(song);
    
    // CRITICAL iOS FIX: Play synchronously to satisfy browser autoplay policies
    if (song && song.audioUrl) {
        const audio = audioRef.current;
        // Only update source if different to avoid reloading if same song clicked (unless we want restart?)
        // Let's allow restart if same song clicked? Usually yes.
        // Actually, if simply navigating, we might want to check.
        // But for explicit "Play" click, we usually want to ensure it plays.
        
        if (audio.src !== song.audioUrl) {
            audio.src = song.audioUrl;
            // Reset time?
            // audio.currentTime = 0; // Browsers do this on new src
        }
        
        // Force play immediately within the click event loop
        audio.play().catch(e => console.warn("Immediate play failed:", e));
    }
  };

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


  // Watch currentSong changes - Fallback for non-click updates (e.g. Next Song via auto-end)
  useEffect(() => {
    const audio = audioRef.current;
    if (currentSong) {
      // If audio source is already set correctly (by synchronous click handler), don't interrupt.
      if (audio.src === currentSong.audioUrl) {
         if (audio.paused) {
             // Try to play if paused (e.g. if previous play() failed or was blocked)
             audio.play().catch(e => console.error("Effect play error:", e));
         }
         return; 
      }

      // If source mismatch (e.g. automated next song), set it.
      // This path typically works fine for "Next Song" because it's triggered by 'ended' event or programmatically, 
      // where browser policy is sometimes lenient if chain is trusted, OR audio context is already active.
      if (audio.src !== currentSong.audioUrl) {
         audio.src = currentSong.audioUrl;
         audio.play().catch(e => console.error("Effect play error:", e));
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

    // --- Log History to Database ---
    if (user && user.uid && song && song.id) {
       api.post('/log-play', { userId: user.uid, songId: song.id })
          .catch(err => console.error("History Log Failed", err));
    }
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
