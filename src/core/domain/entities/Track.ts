import { TrackMetadata, WorkoutType, WORKOUT_PROFILES } from "@/types/track";

/**
 * Entidade Track - OOP: encapsulamento + comportamento no domínio
 * SOLID: Single Responsibility (representa faixa local)
 */
export class Track {
  private readonly _id: string;
  private readonly _filepath: string;
  private _title: string;
  private _artist: string;
  private _album: string;
  private _duration: number;
  private _genre?: string;
  private _year?: string;
  private _extension: string;
  private _dateAdded: number;
  private _fileSize?: number;

  // Enriquecimento (AudioDB/MusicBrainz/Groq)
  private _thumb?: string;
  private _mood?: string;
  private _aiCategory?: string;
  private _aiEnergy?: number;
  private _aiBpm?: number;

  constructor(data: TrackMetadata) {
    this._id = data.id;
    this._filepath = data.filepath;
    this._title = data.title;
    this._artist = data.artist;
    this._album = data.album;
    this._duration = data.duration;
    this._genre = data.genre;
    this._year = data.year;
    this._extension = data.extension;
    this._dateAdded = data.dateAdded;
    this._fileSize = data.fileSize;
  }

  // Getters (read-only onde faz sentido)
  get id() { return this._id; }
  get filepath() { return this._filepath; }
  get title() { return this._title; }
  get artist() { return this._artist; }
  get album() { return this._album; }
  get duration() { return this._duration; }
  get genre() { return this._genre; }
  get year() { return this._year; }
  get extension() { return this._extension; }
  get thumb() { return this._thumb; }

  // Comportamentos de domínio
  getDisplayName(): string {
    return `${this._artist} - ${this._title}`;
  }

  getDurationFormatted(): string {
    const m = Math.floor(this._duration / 60);
    const s = String(this._duration % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  isCompatibleWithWorkout(type: WorkoutType): boolean {
    if (!this._genre) return true;
    const profile = WORKOUT_PROFILES[type];
    // Heurística simples: HQ
    if (profile.intensityCurve === "CONSTANTE_ALTA" && this._genre.toLowerCase().includes("ambient")) return false;
    if (profile.intensityCurve === "CONSTANTE_BAIXA" && this._genre.toLowerCase().includes("metal")) return false;
    return true;
  }

  enrich(data: { genre?: string; mood?: string; thumb?: string; year?: string }): void {
    if (data.genre) this._genre = data.genre;
    if (data.mood) this._mood = data.mood;
    if (data.thumb) this._thumb = data.thumb;
    if (data.year) this._year = data.year;
  }

  applyAiEnrichment(cat: string, vibe: string, bpm: number, energy: number): void {
    this._aiCategory = cat;
    this._mood = vibe;
    this._aiBpm = bpm;
    this._aiEnergy = energy;
  }

  toMetadata(): TrackMetadata {
    return {
      id: this._id,
      filepath: this._filepath,
      title: this._title,
      artist: this._artist,
      album: this._album,
      duration: this._duration,
      genre: this._genre,
      year: this._year,
      extension: this._extension as any,
      dateAdded: this._dateAdded,
      fileSize: this._fileSize,
    };
  }

  toGroqPayload(): { id: string; title: string; artist: string; album: string; duration: number; genre?: string } {
    return {
      id: this._id,
      title: this._title.slice(0, 60),
      artist: this._artist.slice(0, 40),
      album: this._album.slice(0, 40),
      duration: this._duration,
      genre: (this._genre ?? "desconhecido").slice(0, 20),
    };
  }

  static fromMetadata(m: TrackMetadata): Track {
    return new Track(m);
  }

  static fromMetadatas(list: TrackMetadata[]): Track[] {
    return list.map((m) => new Track(m));
  }
}
