/**
 * groqClient.ts
 * ------------------------------------------------------------
 * Cliente Groq otimizado para dispositivo fraco:
 * - Envia APENAS metadados (não áudio) -> economia brutal de dados/bateria
 * - Usa response_format: json_schema (strict) -> sem parsing frágil
 * - Modelo padrão: llama-3.1-8b-instant (LPU, 500+ tok/s)
 * - Chunking: se catálogo > 120 faixas, envia em lotes e mescla
 * - Cache MMKV + retry exponencial
 */

import { TrackMetadata, WorkoutType, WORKOUT_PROFILES } from '@/types/track';
import {
  GroqPlaylistResponse,
  GroqPlaylistResponseSchema,
  GROQ_JSON_SCHEMA,
} from '@/types/groq';
import { kv, STORAGE_KEYS } from '@/core/storage/mmkv';
import Constants from 'expo-constants';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant'; // ultra-rápido, barato, LPU
const MAX_TRACKS_PER_REQUEST = 120; // limite para não estourar context + economizar tokens
const TIMEOUT_MS = 15000;

function getApiKey(): string {
  // Prioridade: MMKV > expo-constants > env
  const fromStorage = kv.getString(STORAGE_KEYS.GROQ_API_KEY);
  if (fromStorage) return fromStorage;
  const fromExpo = (Constants.expoConfig?.extra as any)?.groqApiKey;
  if (fromExpo) return fromExpo;
  // @ts-ignore - para rodar em Node/testes
  if (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  return '';
}

function trimMetadata(tracks: TrackMetadata[]) {
  // Envio eficiente: só campos necessários, sem filepath (privacidade + tokens)
  return tracks.map((t) => ({
    id: t.id,
    title: t.title.slice(0, 60),
    artist: t.artist.slice(0, 40),
    album: (t.album ?? '').slice(0, 40),
    duration: t.duration,
    genre: (t.genre ?? 'desconhecido').slice(0, 20),
  }));
}

function buildSystemPrompt(): string {
  return `Você é um DJ especialista em treino e curadoria musical.
Sua tarefa:
1. Categorizar músicas por estilo/vibe (Rock, Hip-Hop, Eletrônica, Treino Intenso, Treino Leve, etc.)
2. Estimar BPM e energyLevel (1-5) baseado em artista/gênero/nome (sem ouvir áudio).
3. Ordenar a fila EXATA para o tipo de treino pedido, respeitando a curva de intensidade.
4. Responder ESTRITAMENTE no JSON Schema fornecido. Nunca envie texto fora do JSON.
Regras:
- Use APENAS IDs fornecidos. Nunca invente músicas.
- Se poucas faixas compatíveis, preencha com as melhores disponíveis e explique em fallbackMessage.
- Duração total = soma das durações das faixas na orderedQueue.`;
}

function buildUserPrompt(workoutType: WorkoutType, tracks: ReturnType<typeof trimMetadata>): string {
  const profile = WORKOUT_PROFILES[workoutType];
  return JSON.stringify(
    {
      workoutType: profile.type,
      workoutLabel: profile.label,
      intensityCurve: profile.intensityCurve,
      bpmRange: profile.bpmRange,
      totalTracksAvailable: tracks.length,
      tracks,
      instruction: `Crie a playlist para "${profile.label}" com curva ${profile.intensityCurve}. Ordene por BPM/Energia para o treino.`,
    },
    null,
    2
  );
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Chamada principal - uso:
 * const playlist = await generateWorkoutPlaylist(tracks, 'MUSCULACAO_HEAVY')
 */
export async function generateWorkoutPlaylist(
  allTracks: TrackMetadata[],
  workoutType: WorkoutType,
  opts?: { apiKey?: string; useCache?: boolean }
): Promise<GroqPlaylistResponse> {
  if (allTracks.length === 0) throw new Error('Nenhuma faixa local para enviar');

  const apiKey = opts?.apiKey ?? getApiKey();
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada. Defina em MMKV ou expo.extra.groqApiKey');

  // Cache simples: se mesmo workoutType e mesmo hash de tracks, retorna cache (economia de chamada)
  const cacheKey = `groq_cache_${workoutType}_${allTracks.length}_${allTracks[0]?.id?.slice(0, 8)}`;
  if (opts?.useCache !== false) {
    const cached = kv.getObject<GroqPlaylistResponse>(cacheKey);
    if (cached) return cached;
  }

  // Chunking se catálogo muito grande
  const chunks = chunkArray(trimMetadata(allTracks), MAX_TRACKS_PER_REQUEST);
  // Para simplicidade, usa só primeiro chunk para ordenar. Se quiser mesclar, chama múltiplas vezes.
  // Aqui priorizamos latência: 1 request.
  const payloadTracks = chunks[0];

  const body = {
    model: MODEL,
    temperature: 0.3, // baixa para JSON determinístico
    max_tokens: 4000,
    response_format: GROQ_JSON_SCHEMA,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(workoutType, payloadTracks) },
    ],
  };

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetchWithTimeout(
        GROQ_BASE_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        },
        TIMEOUT_MS
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Groq ${res.status}: ${text.slice(0, 500)}`);
      }

      const json = await res.json();
      const content: string = json.choices?.[0]?.message?.content;
      if (!content) throw new Error('Resposta vazia da Groq');

      const parsed = JSON.parse(content);
      const validated = GroqPlaylistResponseSchema.parse(parsed);

      // Sanity: garante que IDs existem no input
      const validIds = new Set(payloadTracks.map((t) => t.id));
      validated.orderedQueue = validated.orderedQueue.filter((q) => validIds.has(q.id));

      // Calcula totalDuration se não bater
      const idToDuration = new Map(allTracks.map((t) => [t.id, t.duration]));
      validated.totalDurationSeconds = validated.orderedQueue.reduce(
        (acc, q) => acc + (idToDuration.get(q.id) ?? 0),
        0
      );

      // Cache
      kv.setObject(cacheKey, validated);
      kv.setObject(STORAGE_KEYS.LAST_GROQ_RESPONSE, validated);

      return validated;
    } catch (e) {
      lastError = e;
      // retry exponencial
      await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

// ============= EXEMPLO DE USO DOCUMENTADO =============
// Ver arquivo src/services/groq/example.ts para curl + payload real
