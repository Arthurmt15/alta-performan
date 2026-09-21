import { useState, useCallback } from "react";
import { TrackMetadata } from "@/types/track";
import { enrichTracksBatch, EnrichedMetadata } from "@/services/music/enrichLocalTracks";

export function useEnrichTracks() {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const enrich = useCallback(async (tracks: TrackMetadata[]) => {
    setIsEnriching(true);
    try {
      const map = await enrichTracksBatch(tracks, {
        onProgress: (done, total) => setProgress({ done, total }),
      });
      return map as Map<string, EnrichedMetadata>;
    } finally {
      setIsEnriching(false);
      setProgress(null);
    }
  }, []);

  return { enrich, isEnriching, progress };
}
