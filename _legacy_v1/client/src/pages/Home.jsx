import { useState } from 'react'

function Home() {
  return (
    <div className="home-container">
      <main style={{ paddingTop: '120px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: '1.1' }}>
          Experience <span style={{ color: 'var(--secondary-color)' }}>Music</span><br />
          Like Never Before
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px' }}>
          Immerse yourself in the soulful rhythms of Sangtamizh. 
          High-fidelity streaming, curated playlists, and a stunning interface.
        </p>
        
        <button className="primary-btn" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
          Start Listening Now
        </button>

        <div className="glass-panel" style={{ marginTop: '5rem', padding: '2rem', width: '90%', maxWidth: '1000px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="feature">
            <h3 style={{ marginBottom: '0.5rem' }}>🔥 Trending Now</h3>
            <p style={{ color: 'var(--text-muted)' }}>Discover what everyone is listening to right now.</p>
          </div>
          <div className="feature">
            <h3 style={{ marginBottom: '0.5rem' }}>🎧 Hi-Res Audio</h3>
            <p style={{ color: 'var(--text-muted)' }}>Lossless quality for the ultimate listening experience.</p>
          </div>
          <div className="feature">
            <h3 style={{ marginBottom: '0.5rem' }}>💑 Curated For You</h3>
            <p style={{ color: 'var(--text-muted)' }}>Personalized playlists based on your taste.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
