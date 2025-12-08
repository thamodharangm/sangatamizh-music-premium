import React from 'react';

const SongCard = ({ song, onPlay }) => {
  return (
    <>
      <div 
        className="card-flat song-card" 
        onClick={() => onPlay && onPlay(song)} 
        style={{ 
          cursor: 'pointer', 
          padding: '0.75rem', 
          position: 'relative',
          background: 'rgba(30, 41, 59, 0.4)', // Glassmorphism base
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          transition: 'transform 0.2s ease, background 0.2s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
          e.currentTarget.querySelector('.play-overlay').style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
          e.currentTarget.querySelector('.play-overlay').style.opacity = '0';
        }}
      >
        <div style={{ 
          position: 'relative',
          width: '100%', 
          aspectRatio: '1/1', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          marginBottom: '0.75rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <img 
            src={song.coverUrl || song.cover_url || 'https://via.placeholder.com/300'} 
            alt={song.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            className="card-image"
          />
          
          {/* Premium Play Overlay */}
          <div className="play-overlay" style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'all 0.3s ease',
          }}>
             <div style={{
               width: '50px',
               height: '50px',
               borderRadius: '50%',
               background: 'var(--primary)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
               transform: 'scale(1)',
               transition: 'transform 0.2s'
             }}>
               <span style={{ fontSize: '1.5rem', color: 'white', marginLeft: '4px' }}>▶</span>
             </div>
          </div>
        </div>
        
        <div style={{ padding: '0 0.25rem' }}>
          <h3 style={{ 
            fontSize: '0.95rem', 
            fontWeight: '600', 
            marginBottom: '0.25rem', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            color: 'white' 
          }}>
            {song.title}
          </h3>
          <p style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)', 
            margin: 0,
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis'
          }}>
            {song.artist}
          </p>
        </div>
      </div>
      <style>{`
        .card-flat:hover .play-overlay {
           opacity: 1;
        }
        .card-flat:hover .card-image {
           transform: scale(1.05);
        }
      `}</style>
    </>
  );
};

export default SongCard;
