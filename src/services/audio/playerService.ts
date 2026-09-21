/**
 * playerService.ts
 * ------------------------------------------------------------
 * Player nativo em segundo plano - consumo mínimo de bateria
 * Usa react-native-track-player (serviço foreground nativo)
 * - Controles de tela de bloqueio / notificação / fone
 * - Fila local otimizada (sem streaming)
 */

import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import { TrackMetadata } from '@/types/track';
import { GroqPlaylistResponse } from '@/types/groq';
import { getDatabase } from '@/core/database';

let isSetup = false;

export async function setupPlayer(): Promise<void> {
  if (isSetup) return;
  await TrackPlayer.setupPlayer({
    // Otimizado para device fraco
    autoHandleInterruptions: true,
    waitForBuffer: false,
  });
  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
    capabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious, Capability.SeekTo, Capability.Stop],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
    notificationCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious],
    progressUpdateEventInterval: 1, // 1s é suficiente, economiza CPU
  });
  isSetup = true;

  // Listener leve
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
}

function toTrackPlayerTrack(t: TrackMetadata) {
  return {
    id: t.id,
    url: t.filepath, // file:// - playback 100% offline
    title: t.title,
    artist: t.artist,
    album: t.album,
    duration: t.duration,
    // artwork opcional: t.filepath.replace('.mp3', '.jpg') se existir
  };
}

/**
 * Cria fila local a partir da resposta da Groq
 * Salva também em SQLite (playlists) para offline futuro
 */
export async function createQueueFromGroqResponse(
  response: GroqPlaylistResponse,
  allTracks: TrackMetadata[]
): Promise<void> {
  await setupPlayer();
  const map = new Map(allTracks.map((t) => [t.id, t]));
  const orderedTracks: TrackMetadata[] = response.orderedQueue
    .map((q) => map.get(q.id))
    .filter(Boolean) as TrackMetadata[];

  if (orderedTracks.length === 0) throw new Error('Nenhuma faixa da resposta encontrada localmente');

  // Reset fila
  await TrackPlayer.reset();
  await TrackPlayer.add(orderedTracks.map(toTrackPlayerTrack));
  await TrackPlayer.setRepeatMode(RepeatMode.Off);

  // Persistir playlist em SQLite para histórico offline
  const db = await getDatabase();
  const playlistId = `pl_${Date.now()}_${response.workoutType}`;
  await db.runAsync(
    `INSERT INTO playlists (id, name, workout_type, curve, total_duration, created_at, is_ai_generated, raw_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      playlistId,
      response.playlistName,
      response.workoutType,
      response.curve,
      response.totalDurationSeconds,
      Date.now(),
      1,
      JSON.stringify(response),
    ]
  );
  await db.withTransactionAsync(async () => {
    const stmt = await db.prepareAsync(`INSERT INTO playlist_tracks (playlist_id, track_id, position, reason) VALUES (?, ?, ?, ?)`);
    try {
      for (const q of response.orderedQueue) {
        await stmt.executeAsync([playlistId, q.id, q.position, q.reason]);
      }
    } finally {
      await stmt.finalizeAsync();
    }
  });
}

export async function play(): Promise<void> {
  const state = await TrackPlayer.getPlaybackState();
  if ((state as any).state === State.Paused || (state as any).state === State.Ready) {
    await TrackPlayer.play();
  }
}

export async function pause(): Promise<void> {
  await TrackPlayer.pause();
}

export async function skipToNext(): Promise<void> {
  await TrackPlayer.skipToNext();
}

export async function getCurrentQueue() {
  return TrackPlayer.getQueue();
}

// playbackService para registrar no index.js (headless)
export const playbackService = async () => {
  // já registrado via addEventListener no setupPlayer
};
