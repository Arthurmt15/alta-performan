/**
 * workoutService - Facade OOP (mantém compat, delega ao UseCase)
 * Antes: funções soltas. Agora: OOP via GenerateWorkoutPlaylistUseCase
 */
import { WorkoutType } from '@/types/track';
import { GenerateWorkoutPlaylistUseCase } from '@/core/use-cases/GenerateWorkoutPlaylist';
import { Playlist } from '@/core/domain/entities/Playlist';

export async function generateAndPlayWorkout(workoutType: WorkoutType, opts?: { apiKey?: string }): Promise<Playlist> {
  const uc = new GenerateWorkoutPlaylistUseCase();
  return uc.execute(workoutType, opts?.apiKey);
}

// Compat: retorna GroqResponse cru se necessário
export async function generateAndPlayWorkoutLegacy(workoutType: WorkoutType, opts?: { apiKey?: string }) {
  const pl = await generateAndPlayWorkout(workoutType, opts);
  return { playlistName: pl.name, totalDuration: pl.getTotalDuration(), tracks: pl.tracks };
}
