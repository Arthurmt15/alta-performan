/**
 * enrichLocalTracks - Orquestra enriquecimento local com APIs externas
 * - Não bloqueia UI: batch + yield + throttle
 * - Prioridade: TheAudioDB (capa/gênero) -> MusicBrainz (tags/ano)
 * - Cache MMKV, fallback silencioso se offline
 */

import { TrackMetadata } from "@/types/track";
import { searchTrack as adbSearchTrack } from "./theaudiodb";
import { searchRecording as mbSearch } from "./musicbrainz";

export interface EnrichedMetadata {
  genre?: string;
  mood?: string;
  year?: string;
  thumb?: string;
  tags?: string[];
}

export async function enrichTrackFull(track: TrackMetadata): Promise<EnrichedMetadata & { track: TrackMetadata }> {
  // Tenta AudioDB primeiro (mais rápido, tem thumb)
  const adb = await adbSearchTrack(track.artist, track.title).catch(() => null);
  if (adb?.genre) {
    return {
      track,
      genre: adb.genre,
      mood: adb.mood,
      year: adb.year,
      thumb: adb.thumb,
      tags: adb.style ? [adb.style] : undefined,
    };
  }
  // Fallback MusicBrainz
  const mb = await mbSearch(track.title, track.artist).catch(() => null);
  if (mb) {
    return {
      track,
      genre: mb.genres?.[0] || mb.tags?.[0],
      year: mb.year,
      tags: mb.tags,
    };
  }
  return { track };
}

function yieldToUI() {
  return new Promise((r) => setTimeout(r, 0));
}

// Enriquece N faixas sem travar UI, com progresso
export async function enrichTracksBatch(
  tracks: TrackMetadata[],
  opts?: { batchSize?: number; onProgress?: (done: number, total: number) => void; signal?: AbortSignal }
): Promise<Map<string, EnrichedMetadata>> {
  const batchSize = opts?.batchSize ?? 5; // 5 por vez para respeitar rate-limit MB (1/s)
  const map = new Map<string, EnrichedMetadata>();

  for (let i = 0; i < tracks.length; i += batchSize) {
    if (opts?.signal?.aborted) break;
    const slice = tracks.slice(i, i + batchSize);
    const results = await Promise.all(slice.map((t) => enrichTrackFull(t)));
    for (const r of results) {
      const { track, ...meta } = r;
      if (meta.genre || meta.thumb) map.set(track.id, meta);
    }
    opts?.onProgress?.(Math.min(i + batchSize, tracks.length), tracks.length);
    await yieldToUI();
  }
  return map;
}
