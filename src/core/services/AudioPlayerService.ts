import { IAudioPlayer } from "../domain/interfaces/IMusicProvider";
import { Playlist } from "../domain/entities/Playlist";
import { setupPlayer as fnSetup } from "@/services/audio/playerService";
import { SqlitePlaylistRepository } from "../domain/repositories/PlaylistRepository";
import TrackPlayer from "react-native-track-player";

/**
 * OOP Singleton + Facade para TrackPlayer
 */
export class AudioPlayerService implements IAudioPlayer {
  private static instance: AudioPlayerService | null = null;
  private isSetup = false;

  private constructor() {}

  static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) AudioPlayerService.instance = new AudioPlayerService();
    return AudioPlayerService.instance;
  }

  async setup(): Promise<void> {
    if (this.isSetup) return;
    await fnSetup();
    this.isSetup = true;
  }

  async loadPlaylist(playlist: Playlist): Promise<void> {
    await this.setup();
    // Reusa função legada via adapter: Playlist -> GroqResponse fake
    const fakeResponse: any = {
      workoutType: playlist.workoutType,
      playlistName: playlist.name,
      totalDurationSeconds: playlist.getTotalDuration(),
      curve: playlist.curve,
      categories: [],
      orderedQueue: playlist.tracks.map((t) => ({
        id: t.track.id,
        position: t.position,
        reason: t.reason ?? "",
        energyLevel: 3,
        estimatedBpm: 120,
      })),
    };
    // Usa repositório TrackPlayer direto para evitar re-geração Groq
    await TrackPlayer.reset();
    await TrackPlayer.add(playlist.toTrackPlayerQueue() as any);
    const repo = new SqlitePlaylistRepository();
    await repo.save(playlist, JSON.stringify(fakeResponse)).catch(() => {});
  }

  async play(): Promise<void> {
    await TrackPlayer.play();
  }

  async pause(): Promise<void> {
    await TrackPlayer.pause();
  }

  // Para testes
  static resetInstance() {
    AudioPlayerService.instance = null;
  }
}
