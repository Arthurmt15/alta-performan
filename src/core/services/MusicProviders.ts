import { IMusicProvider, EnrichedData } from "../domain/interfaces/IMusicProvider";
import { Track } from "../domain/entities/Track";
import { searchTrack as adbSearch } from "@/services/music/theaudiodb";
import { searchRecording as mbSearch } from "@/services/music/musicbrainz";

/**
 * Strategy + Adapter - cada provider implementa mesma interface
 * Open/Closed: adicionar novo provider sem alterar cliente
 */
export class AudioDBProvider implements IMusicProvider {
  readonly name = "TheAudioDB";
  isAvailable() { return true; }
  async search(track: Track): Promise<EnrichedData | null> {
    if (track.artist === "Desconhecido") return null;
    const r = await adbSearch(track.artist, track.title).catch(() => null);
    if (!r) return null;
    return { genre: r.genre, mood: r.mood, thumb: r.thumb, year: r.year, tags: r.style ? [r.style] : undefined };
  }
}

export class MusicBrainzProvider implements IMusicProvider {
  readonly name = "MusicBrainz";
  isAvailable() { return true; }
  async search(track: Track): Promise<EnrichedData | null> {
    const r = await mbSearch(track.title, track.artist).catch(() => null);
    if (!r) return null;
    return { genre: r.genres?.[0] ?? r.tags?.[0], year: r.year, tags: r.tags, thumb: undefined };
  }
}

/**
 * Composite - tenta providers em ordem, Facade para cliente
 */
export class CompositeMusicProvider implements IMusicProvider {
  readonly name = "Composite";
  private providers: IMusicProvider[];
  constructor(providers: IMusicProvider[]) {
    this.providers = providers;
  }
  isAvailable() { return this.providers.some((p) => p.isAvailable()); }
  async search(track: Track): Promise<EnrichedData | null> {
    for (const p of this.providers) {
      const r = await p.search(track);
      if (r?.genre || r?.thumb) return r;
    }
    return null;
  }
}

/**
 * Factory - cria composições padrão
 */
export class MusicProviderFactory {
  static createDefault(): IMusicProvider {
    return new CompositeMusicProvider([new AudioDBProvider(), new MusicBrainzProvider()]);
  }
  static createAudioDBOnly(): IMusicProvider {
    return new AudioDBProvider();
  }
}
