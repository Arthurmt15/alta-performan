import { z } from 'zod';

// ============= INPUT PARA GROQ =============
export interface GroqPlaylistRequest {
  workoutType: string;
  workoutLabel: string;
  intensityCurve: string;
  totalTracksAvailable: number;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: number;
    genre?: string;
  }>;
}

// ============= OUTPUT ESPERADO (JSON SCHEMA) =============
export const GroqTrackSuggestionSchema = z.object({
  id: z.string().describe('ID exato da música enviada no input'),
  position: z.number().int().min(1).describe('Ordem na playlist (1-indexed)'),
  reason: z.string().max(120).describe('Motivo curto: ex: "BPM alto para pico"'),
  energyLevel: z.number().int().min(1).max(5),
  estimatedBpm: z.number().int().min(60).max(220),
});

export const GroqPlaylistResponseSchema = z.object({
  workoutType: z.string(),
  playlistName: z.string().max(60),
  totalDurationSeconds: z.number().int(),
  curve: z.enum(['CRESCENTE', 'DECRESCENTE', 'PICO_CENTRAL', 'CONSTANTE_ALTA', 'CONSTANTE_BAIXA']),
  categories: z.array(
    z.object({
      name: z.string(), // ex: "Treino Intenso"
      vibe: z.string(), // ex: "Agressivo"
      trackIds: z.array(z.string()),
    })
  ),
  orderedQueue: z.array(GroqTrackSuggestionSchema).min(5).max(50),
  fallbackMessage: z.string().optional().describe('Se poucas músicas compatíveis, explica'),
});

export type GroqTrackSuggestion = z.infer<typeof GroqTrackSuggestionSchema>;
export type GroqPlaylistResponse = z.infer<typeof GroqPlaylistResponseSchema>;

// JSON Schema puro para Groq response_format (OpenAI-compatible)
export const GROQ_JSON_SCHEMA = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'workout_playlist',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['workoutType', 'playlistName', 'totalDurationSeconds', 'curve', 'categories', 'orderedQueue'],
      properties: {
        workoutType: { type: 'string' },
        playlistName: { type: 'string' },
        totalDurationSeconds: { type: 'integer' },
        curve: { type: 'string', enum: ['CRESCENTE', 'DECRESCENTE', 'PICO_CENTRAL', 'CONSTANTE_ALTA', 'CONSTANTE_BAIXA'] },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'vibe', 'trackIds'],
            properties: {
              name: { type: 'string' },
              vibe: { type: 'string' },
              trackIds: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        orderedQueue: {
          type: 'array',
          minItems: 5,
          maxItems: 50,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'position', 'reason', 'energyLevel', 'estimatedBpm'],
            properties: {
              id: { type: 'string' },
              position: { type: 'integer', minimum: 1 },
              reason: { type: 'string' },
              energyLevel: { type: 'integer', minimum: 1, maximum: 5 },
              estimatedBpm: { type: 'integer', minimum: 60, maximum: 220 },
            },
          },
        },
        fallbackMessage: { type: 'string' },
      },
    },
  },
} as const;
