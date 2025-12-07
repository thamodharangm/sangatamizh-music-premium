import { useEffect, useState } from 'react';
import api from '../api/axios';

const Library = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await api.get('/songs');
        setSongs(res.data);
      } catch (error) {
        console.error('Failed to fetch songs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ paddingTop: '120px', paddingLeft: '2rem', paddingRight: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Library</h1>
        <input 
          type="text" 
          placeholder="Search songs..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
        {filteredSongs.map(song => (
          <div key={song._id} className="glass-panel" style={{ padding: '1rem' }}>
            <img 
              src={song.coverArt || 'https://via.placeholder.com/150'} 
              alt={song.title} 
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px' }} 
            />
            <h3 style={{ marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{song.artist}</p>
            <audio controls style={{ width: '100%', marginTop: '1rem' }}>
                   {/* In production, verify path. Now it's URL relative to API? NO.
                       The filePath in DB is /uploads/processed/...
                       We need to prepend API URL or serve it from frontend proxy?
                       Frontend Proxy /api -> server
                       But static files are served at /uploads on server.
                       So we should access /uploads/processed/... via http://localhost:3000/uploads/...
                       Wait, our proxy is for /api only.
                       I should add proxy for /uploads too or use absolute URL.
                    */}
              <source src={`http://localhost:3000${song.filePathHigh}`} type="audio/mpeg" />
            </audio>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
