import { Track } from "../entities/Track";
import { ITrackRepository } from "../interfaces/IMusicProvider";
import { getDatabase, upsertTracksBatch, getAllTracks, getTrackCount, clearTracks } from "@/core/database";

/**
 * Repository OOP - abstrai SQLite, Single Responsibility
 */
export class SqliteTrackRepository implements ITrackRepository {
  async findAll(): Promise<Track[]> {
    const metas = await getAllTracks();
    return Track.fromMetadatas(metas);
  }

  async saveBatch(tracks: Track[]): Promise<void> {
    await upsertTracksBatch(tracks.map((t) => t.toMetadata()));
  }

  async count(): Promise<number> {
    return getTrackCount();
  }

  async clear(): Promise<void> {
    await clearTracks();
  }

  // Extra: acesso direto ao DB para transações avançadas
  async getDatabase() {
    return getDatabase();
  }
}
