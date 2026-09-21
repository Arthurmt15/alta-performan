/**
 * workoutService - Orquestra: Tracks locais -> Groq -> Fila
 */
import { getAllTracks } from '@/core/database';
import { WorkoutType } from '@/types/track';
import { generateWorkoutPlaylist } from '@/services/groq/groqClient';
import { createQueueFromGroqResponse, play } from '@/services/audio/playerService';

export async function generateAndPlayWorkout(workoutType: WorkoutType, opts?: { apiKey?: string }) {
  const tracks = await getAllTracks();
  if (tracks.length < 5) throw new Error(`Mínimo 5 músicas locais necessárias. Encontradas: ${tracks.length}`);

  const groqResponse = await generateWorkoutPlaylist(tracks, workoutType, { apiKey: opts?.apiKey });
  await createQueueFromGroqResponse(groqResponse, tracks);
  await play();
  return groqResponse;
}
