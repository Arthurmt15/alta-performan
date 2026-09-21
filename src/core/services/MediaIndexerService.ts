import { Track } from "../domain/entities/Track";
import { ITrackRepository } from "../domain/interfaces/IMusicProvider";
import { SqliteTrackRepository } from "../domain/repositories/TrackRepository";
import { indexLocalTracks, IndexingProgress } from "@/services/indexing/mediaIndexer";

/**
 * Service OOP - Indexação com DI do repositório
 * Mantém lógica legada (batch + yield) mas expõe OOP
 */
export class MediaIndexerService {
  private repository: ITrackRepository;

  constructor(repository?: ITrackRepository) {
    this.repository = repository ?? new SqliteTrackRepository();
  }

  // Observer pattern: callbacks
  async index(onProgress?: (p: IndexingProgress) => void): Promise<Track[]> {
    const metas = await indexLocalTracks({
      onProgress,
      onBatchComplete: async () => {}, // já persiste em DB via indexLocalTracks
    });
    return Track.fromMetadatas(metas);
  }

  async getAll(): Promise<Track[]> {
    return this.repository.findAll();
  }

  async count(): Promise<number> {
    return this.repository.count();
  }
}
