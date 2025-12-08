import { useEffect, useState } from 'react';
import api from '../api/axios';
import SongCard from '../components/SongCard'; 
import { useMusic } from '../context/MusicContext';

const Library = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusic();

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await api.get('/songs'); 
        // Normalize backend data to match SongCard props
        const normalized = res.data.map(s => ({
            ...s,
            coverUrl: s.cover_url || s.coverArt, // Normalize cover
            audioUrl: s.file_url || s.filePathHigh // Normalize for player
        }));
        setSongs(normalized);
      } catch (error) {
        console.error('Failed to fetch songs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter(song => 
    (song.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.artist || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem 0', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="library-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h1 style={{ color: 'white' }}>Library</h1>
        <input 
          type="text" 
          placeholder="Search songs..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-flat search-input"
        />
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading library...</div>
      ) : filteredSongs.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {filteredSongs.map(song => (
            <SongCard key={song.id || song._id} song={song} onPlay={playSong} />
          ))}
        </div>
      ) : (
        <div className="card-flat" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No songs found in your library.</p>
        </div>
      )}
    </div>
  );
};

export default Library;
