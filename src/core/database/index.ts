import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import { TrackMetadata } from '@/types/track';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('alta_performan.db', { useNewConnection: false });
  await db.execAsync(CREATE_TABLES_SQL);
  return db;
}

// Batch insert otimizado - transação única
export async function upsertTracksBatch(tracks: TrackMetadata[]): Promise<void> {
  if (tracks.length === 0) return;
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    const stmt = await database.prepareAsync(
      `INSERT OR REPLACE INTO tracks
       (id, filepath, title, artist, album, duration, genre, year, extension, file_size, date_added)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    try {
      for (const t of tracks) {
        await stmt.executeAsync([
          t.id,
          t.filepath,
          t.title,
          t.artist,
          t.album,
          t.duration,
          t.genre ?? null,
          t.year ?? null,
          t.extension,
          t.fileSize ?? null,
          t.dateAdded,
        ]);
      }
    } finally {
      await stmt.finalizeAsync();
    }
  });
}

export async function getAllTracks(): Promise<TrackMetadata[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>('SELECT * FROM tracks ORDER BY artist, title');
  return rows.map((r) => ({
    id: r.id,
    filepath: r.filepath,
    title: r.title,
    artist: r.artist,
    album: r.album,
    duration: r.duration,
    genre: r.genre,
    year: r.year,
    extension: r.extension,
    fileSize: r.file_size,
    dateAdded: r.date_added,
  }));
}

export async function getTrackCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM tracks');
  return row?.c ?? 0;
}

export async function clearTracks(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync('DELETE FROM tracks');
}
