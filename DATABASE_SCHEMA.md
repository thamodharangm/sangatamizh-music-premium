# PostgreSQL Database Schema & Caching Strategy

## 1. SQL Schema

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE song_status AS ENUM ('uploaded', 'processing', 'ready', 'failed', 'blocked');
CREATE TYPE analytics_event_type AS ENUM ('play', 'preview', 'download', 'skip');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'user',
    avatar_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for login lookup
CREATE INDEX idx_users_email ON users(email);

-- 2. Songs Table
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Metadata
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    genre VARCHAR(50),
    duration_seconds INTEGER,
    cover_image_key VARCHAR(255),

    -- Technical Data
    status song_status DEFAULT 'uploaded',
    metadata JSONB DEFAULT '{}', -- Extra info like BPM, key, tags

    -- Storage Reference (JSONB for flexibility with multiple variants)
    -- Structure: { "high": "s3/key.mp3", "low": "s3/key_64.mp3", "preview": "s3/key_p.mp3" }
    storage_keys JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Search and Filtering
CREATE INDEX idx_songs_title_artist ON songs USING gin ((title || ' ' || artist) gin_trgm_ops); -- Requires pg_trgm extension for fuzzy search
CREATE INDEX idx_songs_status ON songs(status);
CREATE INDEX idx_songs_created_at ON songs(created_at DESC); -- For "New Releases"

-- 3. Uploads (Audit/Tracking Log for raw files)
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_size BIGINT NOT NULL, -- in bytes
    mime_type VARCHAR(100),
    job_id VARCHAR(100), -- Reference to BullMQ/Worker Job ID
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_uploads_job ON uploads(job_id);

-- 4. Playlists
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    cover_image_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_playlists_user ON playlists(user_id);
CREATE INDEX idx_playlists_public ON playlists(is_public) WHERE is_public = TRUE;

-- 5. Playlist Songs (Many-to-Many)
CREATE TABLE playlist_songs (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, song_id)
);

-- Ensure unique positions within a playlist (deferrable for reordering)
CREATE UNIQUE INDEX idx_playlist_position ON playlist_songs(playlist_id, position);

-- 6. Analytics
CREATE TABLE song_analytics (
    id BIGSERIAL PRIMARY KEY,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anon plays
    event_type analytics_event_type NOT NULL,
    device_info JSONB, -- { "platform": "web", "browser": "chrome", "ip": "..." }
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- High-cardinality table, partition by time for production usage
CREATE INDEX idx_analytics_song_event ON song_analytics(song_id, event_type);
CREATE INDEX idx_analytics_time ON song_analytics(timestamp);

```

## 2. Redis Caching Strategy

To reduce DB load and improve latency for high-traffic features.

### A. Top Tracks (Leaderboards)

Instead of aggregating `song_analytics` constantly, use Redis Sorted Sets.

- **Key**: `leaderboard:songs:daily:{date}` (e.g., `leaderboard:songs:daily:2025-12-07`)
- **Structure**: Sorted Set (`ZSET`)
- **Member**: `song_id`
- **Score**: Number of plays
- **Usage**:
  - On Play: `ZINCRBY leaderboard:songs:daily:2025-12-07 1 {song_id}`
  - Get Top 10: `ZREVRANGE leaderboard:songs:daily:2025-12-07 0 9 WITHSCORES`

### B. Search Results

Cache complex search queries to avoid expensive text search / joins.

- **Key**: `search:{query_hash}`
- **Structure**: String (JSON Blob)
- **TTL**: 5-10 minutes (Short TTL as catalog changes)
- **Usage**:
  - Key = `search:md5("tamil melody songs")`
  - Value = JSON array of song objects.

### C. Song Metadata (Hot Data)

Avoid querying the `songs` table for every stream request.

- **Key**: `song:{song_id}`
- **Structure**: String (JSON serialized Song entity) or Hash
- **TTL**: 24 hours (Invalidate on update)
- **Content**: `{ "id": "...", "title": "...", "storage_keys": {...} }`

### D. User Sessions

Manage Auth tokens and refresh rotation.

- **Key**: `session:{user_id}:{device_id}`
- **Value**: Refresh Token
- **TTL**: 7 days
