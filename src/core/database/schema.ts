/**
 * SQLite leve - sem ORM pesado, SQL puro
 * expo-sqlite com prepared statements
 */

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000; -- 64MB

CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY NOT NULL,
  filepath TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT NOT NULL,
  duration INTEGER NOT NULL,
  genre TEXT,
  year TEXT,
  extension TEXT NOT NULL,
  file_size INTEGER,
  date_added INTEGER NOT NULL,
  ai_category TEXT,
  ai_vibe TEXT,
  ai_energy INTEGER
);

CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  curve TEXT NOT NULL,
  total_duration INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  is_ai_generated INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT -- Groq response cache
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  reason TEXT,
  PRIMARY KEY (playlist_id, position)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_pid ON playlist_tracks(playlist_id);
`;
