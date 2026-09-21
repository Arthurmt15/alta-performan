import { Playlist } from "../entities/Playlist";
import { IPlaylistRepository } from "../interfaces/IMusicProvider";
import { getDatabase } from "@/core/database";

export class SqlitePlaylistRepository implements IPlaylistRepository {
  async save(playlist: Playlist, rawJson: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO playlists (id, name, workout_type, curve, total_duration, created_at, is_ai_generated, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [playlist.id, playlist.name, playlist.workoutType, playlist.curve, playlist.getTotalDuration(), Date.now(), 1, rawJson]
    );
    await db.withTransactionAsync(async () => {
      const stmt = await db.prepareAsync(`INSERT INTO playlist_tracks (playlist_id, track_id, position, reason) VALUES (?, ?, ?, ?)`);
      try {
        for (const t of playlist.tracks) {
          await stmt.executeAsync([playlist.id, t.track.id, t.position, t.reason ?? null]);
        }
      } finally {
        await stmt.finalizeAsync();
      }
    });
  }

  async findById(id: string): Promise<Playlist | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(`SELECT * FROM playlists WHERE id = ?`, [id]);
    if (!row) return null;
    return new Playlist(row.id, row.name, row.workout_type, row.curve);
  }
}
