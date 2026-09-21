import { Track } from "../entities/Track";

export interface EnrichedData {
  genre?: string;
  mood?: string;
  thumb?: string;
  year?: string;
  tags?: string[];
}

/**
 * Interface Segregation - Provider específico
 */
export interface IMusicProvider {
  readonly name: string;
  search(track: Track): Promise<EnrichedData | null>;
  isAvailable(): boolean;
}

export interface IPlaylistGenerator {
  generate(tracks: Track[], workoutType: string): Promise<import("@/types/groq").GroqPlaylistResponse>;
}

export interface ITrackRepository {
  findAll(): Promise<Track[]>;
  saveBatch(tracks: Track[]): Promise<void>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

export interface IPlaylistRepository {
  save(playlist: import("../entities/Playlist").Playlist, rawJson: string): Promise<void>;
  findById(id: string): Promise<import("../entities/Playlist").Playlist | null>;
}

export interface IAudioPlayer {
  setup(): Promise<void>;
  loadPlaylist(playlist: import("../entities/Playlist").Playlist): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
}
