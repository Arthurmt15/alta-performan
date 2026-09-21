/**
 * DI Container simples - Service Locator OOP
 * Centraliza criação, aplica Singleton onde faz sentido
 */
import { SqliteTrackRepository } from "../domain/repositories/TrackRepository";
import { SqlitePlaylistRepository } from "../domain/repositories/PlaylistRepository";
import { MediaIndexerService } from "./MediaIndexerService";
import { GroqPlaylistService } from "./GroqPlaylistService";
import { AudioPlayerService } from "./AudioPlayerService";
import { MusicProviderFactory } from "./MusicProviders";
import { CompositeMusicProvider } from "./MusicProviders";

export class Container {
  private static trackRepo: SqliteTrackRepository | null = null;
  private static playlistRepo: SqlitePlaylistRepository | null = null;

  static getTrackRepository(): SqliteTrackRepository {
    if (!this.trackRepo) this.trackRepo = new SqliteTrackRepository();
    return this.trackRepo;
  }

  static getPlaylistRepository(): SqlitePlaylistRepository {
    if (!this.playlistRepo) this.playlistRepo = new SqlitePlaylistRepository();
    return this.playlistRepo;
  }

  static getIndexer(): MediaIndexerService {
    return new MediaIndexerService(this.getTrackRepository());
  }

  static getGroqService(apiKey?: string): GroqPlaylistService {
    return new GroqPlaylistService(apiKey);
  }

  static getPlayer(): AudioPlayerService {
    return AudioPlayerService.getInstance();
  }

  static getMusicProvider(): CompositeMusicProvider {
    return MusicProviderFactory.createDefault() as CompositeMusicProvider;
  }
}
