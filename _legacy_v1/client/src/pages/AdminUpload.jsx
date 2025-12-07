import { useState } from 'react';
import api from '../api/axios';

const AdminUpload = () => {
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [metadata, setMetadata] = useState({ title: '', artist: '', album: '', category: '' });
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCoverChange = (e) => {
    setCover(e.target.files[0]);
  };

  const handleMetadataChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('audio', file);
    if (cover) formData.append('cover', cover);
    formData.append('title', metadata.title);
    formData.append('artist', metadata.artist);
    formData.append('album', metadata.album);
    formData.append('category', metadata.category);

    try {
      await api.post('/songs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Upload Successful!');
      setFile(null);
      setCover(null);
      setMetadata({ title: '', artist: '', album: '', category: '' });
    } catch (error) {
      setMessage('Upload Failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeImport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/songs/youtube-import', { url: youtubeUrl, category: metadata.category });
      setMessage('YouTube Import Successful!');
      setYoutubeUrl('');
    } catch (error) {
       setMessage('Import Failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '120px auto', padding: '2rem' }}>
      <h2>Admin Upload</h2>
      {message && <p>{message}</p>}

      <div style={{ marginBottom: '2rem' }}>
        <h3>Details</h3>
         <input type="text" name="title" placeholder="Title" value={metadata.title} onChange={handleMetadataChange} style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '0.5rem' }} />
         <input type="text" name="artist" placeholder="Artist" value={metadata.artist} onChange={handleMetadataChange} style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '0.5rem' }} />
         <input type="text" name="album" placeholder="Album" value={metadata.album} onChange={handleMetadataChange} style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '0.5rem' }} />
         <input type="text" name="category" placeholder="Category" value={metadata.category} onChange={handleMetadataChange} style={{ display: 'block', margin: '0.5rem 0', width: '100%', padding: '0.5rem' }} />
      </div>

      <hr />

      <form onSubmit={handleUpload} style={{ marginBottom: '2rem' }}>
        <h3>File Upload</h3>
        <label>Audio File:</label>
        <input type="file" accept="audio/*" onChange={handleFileChange} required />
        <br/><br/>
        <label>Cover Art:</label>
        <input type="file" accept="image/*" onChange={handleCoverChange} />
        <br/><br/>
        <button className="primary-btn" disabled={loading}>{loading ? 'Uploading...' : 'Upload File'}</button>
      </form>

      <hr />

      <form onSubmit={handleYoutubeImport}>
        <h3>YouTube Import</h3>
        <input 
          type="text" 
          placeholder="YouTube URL" 
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
        <button className="primary-btn" disabled={loading}>{loading ? 'Importing...' : 'Import from YouTube'}</button>
      </form>
    </div>
  );
};

export default AdminUpload;
