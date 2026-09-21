import { useState, useCallback } from "react";
import { WorkoutType } from "@/types/track";
import { GenerateWorkoutPlaylistUseCase } from "@/core/use-cases/GenerateWorkoutPlaylist";
import { Playlist } from "@/core/domain/entities/Playlist";

export function useWorkout() {
  const [loading, setLoading] = useState<WorkoutType | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (type: WorkoutType, apiKey?: string) => {
    setLoading(type);
    setError(null);
    try {
      const uc = new GenerateWorkoutPlaylistUseCase();
      const pl = await uc.execute(type, apiKey);
      setPlaylist(pl);
      return pl;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(null);
    }
  }, []);

  return { loading, playlist, error, generate };
}
