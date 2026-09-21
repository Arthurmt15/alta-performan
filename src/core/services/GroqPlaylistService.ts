import { Track } from "../domain/entities/Track";
import { WorkoutType } from "@/types/track";
import { GroqPlaylistResponse } from "@/types/groq";
import { generateWorkoutPlaylist as fnGenerate } from "@/services/groq/groqClient";
import { IPlaylistGenerator } from "../domain/interfaces/IMusicProvider";
import { Playlist } from "../domain/entities/Playlist";

/**
 * Service OOP - Single Responsibility, Dependency Inversion
 * Encapsula Groq, expõe método de alto nível
 */
export class GroqPlaylistService implements IPlaylistGenerator {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  // DIP: depende de abstração Track, não de TrackMetadata cru
  async generate(tracks: Track[], workoutType: string): Promise<GroqPlaylistResponse> {
    if (tracks.length < 5) throw new Error(`Mínimo 5 faixas, encontradas: ${tracks.length}`);
    // Adapter: Track -> metadata cru para função legada
    const metas = tracks.map((t) => t.toMetadata());
    return fnGenerate(metas as any, workoutType as WorkoutType, { apiKey: this.apiKey });
  }

  async generatePlaylist(tracks: Track[], workoutType: WorkoutType): Promise<Playlist> {
    const response = await this.generate(tracks, workoutType);
    return Playlist.fromGroqResponse(response, tracks);
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }
}
