/**
 * MusicBrainz API - Gratuita, sem chave, rate-limit 1 req/s
 * Docs: https://musicbrainz.org/doc/MusicBrainz_API
 * Uso: enriquecer metadados locais (gênero, ano, tags) sem processar áudio
 *
 * Otimizações para device fraco:
 * - User-Agent obrigatório (MusicBrainz exige)
 * - Cache MMKV + SQLite (evita requisições repetidas)
 * - Throttle 1100ms entre calls
 * - Timeout 8s
 */

import { kv } from "@/core/storage/mmkv";

const MB_BASE = "https://musicbrainz.org/ws/2";
const USER_AGENT = "AltaPerforman/0.1.0 ( arthur@example.com )"; // troque pelo seu contato

let lastCall = 0;
async function throttle() {
  const now = Date.now();
  const wait = 1100 - (now - lastCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

export interface MBRecording {
  mbid: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
  tags?: string[]; // ex: ["hip hop", "trap"]
  genres?: string[];
  score?: number;
}

export async function searchRecording(title: string, artist: string): Promise<MBRecording | null> {
  const cacheKey = `mb_${artist.toLowerCase()}_${title.toLowerCase()}`.slice(0, 80);
  const cached = kv.getObject<MBRecording>(cacheKey);
  if (cached) return cached;

  await throttle();
  const query = `recording:"${encodeURIComponent(title)}" AND artist:"${encodeURIComponent(artist)}"`;
  const url = `${MB_BASE}/recording?query=${query}&fmt=json&limit=3`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rec = json.recordings?.[0];
    if (!rec) return null;

    const result: MBRecording = {
      mbid: rec.id,
      title: rec.title,
      artist: rec["artist-credit"]?.[0]?.name ?? artist,
      album: rec.releases?.[0]?.title,
      year: rec["first-release-date"]?.slice(0, 4),
      tags: rec.tags?.map((t: any) => t.name).slice(0, 5),
      genres: rec.tags?.map((t: any) => t.name).slice(0, 3),
      score: rec.score,
    };
    kv.setObject(cacheKey, result);
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export async function lookupRelease(mbid: string) {
  await throttle();
  const url = `${MB_BASE}/release/${mbid}?fmt=json&inc=tags+genres`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  return res.json();
}

// Batch helper com rate-limit
export async function enrichBatch(tracks: Array<{ title: string; artist: string }>, onProgress?: (i: number) => void) {
  const out: (MBRecording | null)[] = [];
  for (let i = 0; i < tracks.length; i++) {
    const r = await searchRecording(tracks[i].title, tracks[i].artist);
    out.push(r);
    onProgress?.(i + 1);
  }
  return out;
}
