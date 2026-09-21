/**
 * TheAudioDB - The Free Music API
 * Docs: https://www.theaudiodb.com/api_guide.php
 * Endpoints gratuitos (sem key ou key 123 / 1):
 * - https://www.theaudiodb.com/api/v1/json/123/search.php?s=artist
 * - https://www.theaudiodb.com/api/v1/json/123/searchtrack.php?s=artist&t=track
 * - https://www.theaudiodb.com/api/v1/json/123/mvid.php?i=artistId
 *
 * Usamos para: capa do álbum, gênero, mood, bpm estimado? (se disponível), bio
 * Cache MMKV + throttle leve
 */

import { kv } from "@/core/storage/mmkv";

const ADB_BASE = "https://www.theaudiodb.com/api/v1/json/123"; // 123 = demo key, troque por sua key se tiver

export interface AudioDBTrack {
  artist: string;
  track: string;
  album?: string;
  genre?: string;
  mood?: string;
  style?: string;
  thumb?: string; // capa
  year?: string;
  description?: string;
}

export interface AudioDBArtist {
  artist: string;
  genre?: string;
  mood?: string;
  style?: string;
  biography?: string;
  thumb?: string;
  fanart?: string;
}

async function fetchWithTimeout(url: string, timeout = 8000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export async function searchTrack(artist: string, track: string): Promise<AudioDBTrack | null> {
  if (!artist || artist === "Desconhecido") return null;
  const key = `adb_t_${artist.toLowerCase()}_${track.toLowerCase()}`.slice(0, 80);
  const cached = kv.getObject<AudioDBTrack>(key);
  if (cached) return cached;

  const url = `${ADB_BASE}/searchtrack.php?s=${encodeURIComponent(artist)}&t=${encodeURIComponent(track)}`;
  const json = await fetchWithTimeout(url);
  const t = json?.track?.[0];
  if (!t) return null;

  const result: AudioDBTrack = {
    artist: t.strArtist,
    track: t.strTrack,
    album: t.strAlbum,
    genre: t.strGenre,
    mood: t.strMood,
    style: t.strStyle,
    thumb: t.strTrackThumb || t.strAlbumThumb,
    year: t.intYearReleased,
    description: t.strDescriptionEN?.slice(0, 400),
  };
  kv.setObject(key, result);
  return result;
}

export async function searchArtist(artist: string): Promise<AudioDBArtist | null> {
  const key = `adb_a_${artist.toLowerCase()}`.slice(0, 60);
  const cached = kv.getObject<AudioDBArtist>(key);
  if (cached) return cached;

  const url = `${ADB_BASE}/search.php?s=${encodeURIComponent(artist)}`;
  const json = await fetchWithTimeout(url);
  const a = json?.artists?.[0];
  if (!a) return null;

  const result: AudioDBArtist = {
    artist: a.strArtist,
    genre: a.strGenre,
    mood: a.strMood,
    style: a.strStyle,
    biography: a.strBiographyEN?.slice(0, 600),
    thumb: a.strArtistThumb,
    fanart: a.strArtistFanart,
  };
  kv.setObject(key, result);
  return result;
}

// Fallback: tenta track, se falhar tenta artista
export async function enrichTrack(artist: string, title: string): Promise<AudioDBTrack & { artistInfo?: AudioDBArtist }> {
  const track = await searchTrack(artist, title);
  if (track?.genre) return track;
  const artistInfo = await searchArtist(artist);
  if (!artistInfo) return track as any;
  return {
    artist,
    track: title,
    genre: artistInfo.genre,
    mood: artistInfo.mood,
    style: artistInfo.style,
    thumb: artistInfo.thumb,
    artistInfo,
  } as any;
}
