import { WorkoutType } from "@/types/track";
import { Container } from "../services/Container";
import { Playlist } from "../domain/entities/Playlist";

/**
 * UseCase OOP - Orquestra fluxo com DI
 * SOLID: depende de abstrações via Container
 */
export class GenerateWorkoutPlaylistUseCase {
  async execute(workoutType: WorkoutType, apiKey?: string): Promise<Playlist> {
    const trackRepo = Container.getTrackRepository();
    const groq = Container.getGroqService(apiKey);
    const player = Container.getPlayer();
    const plRepo = Container.getPlaylistRepository();

    const tracks = await trackRepo.findAll();
    if (tracks.length < 5) throw new Error(`Mínimo 5 faixas, encontradas: ${tracks.length}`);

    const playlist = await groq.generatePlaylist(tracks, workoutType);
    await player.loadPlaylist(playlist);
    await player.play();
    await plRepo.save(playlist, JSON.stringify(playlist)).catch(() => {});
    return playlist;
  }
}
