import { Track } from "./Track";
import { WorkoutType } from "@/types/track";
import { GroqPlaylistResponse } from "@/types/groq";

/**
 * Entidade Playlist - Agregado OOP
 * Encapsula ordenação, duração, validações
 */
export class Playlist {
  private readonly _id: string;
  private _name: string;
  private _workoutType: WorkoutType;
  private _curve: string;
  private _tracks: { track: Track; position: number; reason?: string }[] = [];
  private _createdAt: number;

  constructor(id: string, name: string, workoutType: WorkoutType, curve: string) {
    this._id = id;
    this._name = name;
    this._workoutType = workoutType;
    this._curve = curve;
    this._createdAt = Date.now();
  }

  get id() { return this._id; }
  get name() { return this._name; }
  get workoutType() { return this._workoutType; }
  get curve() { return this._curve; }
  get tracks() { return [...this._tracks]; }
  get createdAt() { return this._createdAt; }

  addTrack(track: Track, position: number, reason?: string): void {
    if (this._tracks.some((t) => t.track.id === track.id)) throw new Error(`Track ${track.id} já na playlist`);
    this._tracks.push({ track, position, reason });
    this._tracks.sort((a, b) => a.position - b.position);
  }

  getTotalDuration(): number {
    return this._tracks.reduce((acc, t) => acc + t.track.duration, 0);
  }

  getTotalDurationFormatted(): string {
    const total = this.getTotalDuration();
    const m = Math.floor(total / 60);
    return `${m} min`;
  }

  toTrackPlayerQueue(): { id: string; url: string; title: string; artist: string }[] {
    return this._tracks.map(({ track }) => ({
      id: track.id,
      url: track.filepath,
      title: track.title,
      artist: track.artist,
    }));
  }

  static fromGroqResponse(response: GroqPlaylistResponse, allTracks: Track[]): Playlist {
    const pl = new Playlist(`pl_${Date.now()}_${response.workoutType}`, response.playlistName, response.workoutType as WorkoutType, response.curve);
    const map = new Map(allTracks.map((t) => [t.id, t]));
    for (const q of response.orderedQueue) {
      const track = map.get(q.id);
      if (track) {
        track.applyAiEnrichment("", q.reason, q.estimatedBpm, q.energyLevel);
        pl.addTrack(track, q.position, q.reason);
      }
    }
    return pl;
  }
}
