import { useMusic } from '../context/MusicContext';
import './MusicPlayer.css';

const MusicPlayer = () => {
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    nextSong, 
    prevSong,
    currentTime,
    duration,
    seek 
  } = useMusic();

  if (!currentSong) return null;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    const width = e.currentTarget.clientWidth;
    const clickX = e.nativeEvent.offsetX;
    const newTime = (clickX / width) * duration;
    seek(newTime);
  };

  return (
    <div className="music-player">
      <div className="mp-song-info">
        <div 
          className="mp-art" 
          style={{ backgroundImage: `url(${currentSong.coverUrl || 'https://via.placeholder.com/50'})` }} 
        />
        <div className="mp-details">
          <h4 className="mp-title">{currentSong.title}</h4>
          <p className="mp-artist">{currentSong.artist}</p>
        </div>
      </div>

      <div className="mp-controls">
        <button className="mp-btn-mini" onClick={prevSong} aria-label="Previous">
          ⏮
        </button>
        <button 
          onClick={togglePlay}
          className="mp-play-btn"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="mp-btn-mini" onClick={nextSong} aria-label="Next">
          ⏭
        </button>
      </div>

      {/* Progress Bar (Interactive) */}
      <div className="mp-progress-container" onClick={handleSeek}>
        <div 
          className="mp-progress-bar" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MusicPlayer;
