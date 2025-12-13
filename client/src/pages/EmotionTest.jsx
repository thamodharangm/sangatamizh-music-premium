import { useState } from 'react';
import api from '../config/api';

const EmotionTest = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testEmotion = async () => {
    if (!youtubeUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/yt-metadata', { url: youtubeUrl });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'white', marginBottom: '2rem' }}>🧪 Emotion Detection Test</h1>
      
      <div className="card-flat" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Test YouTube URL</h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            className="input-flat"
            placeholder="Paste YouTube URL here..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn-3d btn-primary"
            onClick={testEmotion}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Test'}
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Try these test URLs:
          <ul style={{ marginTop: '0.5rem' }}>
            <li>Motivation: https://youtu.be/tkql_yvuSK0</li>
            <li>Feel Good: https://youtu.be/oLgzs8nut3A</li>
            <li>Romantic: https://youtu.be/0s3_UJ2zlJk</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="card-flat" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', marginBottom: '2rem' }}>
          <p style={{ color: '#fca5a5', margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {result && (
        <div className="card-flat" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>✅ Analysis Result</h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--text-muted)' }}>Title:</strong>
              <p style={{ color: 'white', margin: '0.25rem 0 0 0' }}>{result.title}</p>
            </div>

            <div>
              <strong style={{ color: 'var(--text-muted)' }}>Artist:</strong>
              <p style={{ color: 'white', margin: '0.25rem 0 0 0' }}>{result.artist || 'Unknown'}</p>
            </div>

            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>🎯 Detected Emotion:</strong>
              <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                {result.suggestedEmotion || result.emotion || 'Not detected'}
              </p>
            </div>

            <div>
              <strong style={{ color: 'var(--text-muted)' }}>Confidence:</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ 
                  flex: 1, 
                  height: '20px', 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${(result.emotionConfidence || result.confidence || 0) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <span style={{ color: 'white', fontWeight: 'bold' }}>
                  {Math.round((result.emotionConfidence || result.confidence || 0) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--text-muted)' }}>Suggested Category:</strong>
              <p style={{ color: 'white', margin: '0.25rem 0 0 0' }}>
                {result.suggestedCategory || result.category || 'General'}
              </p>
            </div>

            {result.emotionAnalysis && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--text-muted)' }}>Analysis Details:</strong>
                <pre style={{ color: 'white', fontSize: '0.85rem', margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(result.emotionAnalysis, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card-flat" style={{ padding: '1.5rem', marginTop: '2rem', background: 'rgba(59, 130, 246, 0.1)' }}>
        <h4 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0' }}>💡 How It Works</h4>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          <li>Analyzes video title, description, and tags</li>
          <li>Detects emotions: Sad songs, Feel Good, Vibe, Motivation</li>
          <li>Returns confidence score (50-95%)</li>
          <li>Suggests category for library organization</li>
        </ul>
      </div>
    </div>
  );
};

export default EmotionTest;
