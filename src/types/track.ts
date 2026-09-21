/**
 * Tipos centrais - leves, sem dependências pesadas
 * Otimizado para MMKV/SQLite (tudo serializável)
 */

export interface TrackMetadata {
  id: string; // hash do filepath ou MediaStore id
  filepath: string; // file://...
  title: string;
  artist: string;
  album: string;
  duration: number; // segundos
  genre?: string;
  year?: string;
  bitrate?: number;
  fileSize?: number;
  extension: 'mp3' | 'm4a' | 'flac' | 'wav' | 'ogg' | string;
  dateAdded: number; // timestamp
}

export interface EnrichedTrack extends TrackMetadata {
  // Campos adicionados pela IA (Groq)
  aiCategory?: string; // ex: "Treino Intenso"
  aiSubgenre?: string; // ex: "Trap Intense"
  aiVibe?: string; // ex: "Agressivo", "Motivacional"
  aiBpmEstimate?: number; // estimado pela IA via metadados (sem análise de áudio)
  aiEnergyLevel?: 1 | 2 | 3 | 4 | 5;
}

export type WorkoutType =
  | 'MUSCULACAO_HEAVY'
  | 'CORRIDA_CARDIO'
  | 'HIIT_EXPLOSIVO'
  | 'PILATES_ALONGAMENTO'
  | 'AQUECIMENTO_LEVE'
  | 'CROSSFIT';

export interface WorkoutProfile {
  type: WorkoutType;
  label: string;
  description: string;
  intensityCurve: 'CRESCENTE' | 'DECRESCENTE' | 'PICO_CENTRAL' | 'CONSTANTE_ALTA' | 'CONSTANTE_BAIXA';
  bpmRange: [number, number];
}

export const WORKOUT_PROFILES: Record<WorkoutType, WorkoutProfile> = {
  MUSCULACAO_HEAVY: {
    type: 'MUSCULACAO_HEAVY',
    label: 'Musculação Heavy',
    description: 'Batida constante, alta energia, grave forte',
    intensityCurve: 'CONSTANTE_ALTA',
    bpmRange: [130, 160],
  },
  CORRIDA_CARDIO: {
    type: 'CORRIDA_CARDIO',
    label: 'Corrida Cardio',
    description: 'BPM crescente, progressão linear',
    intensityCurve: 'CRESCENTE',
    bpmRange: [120, 180],
  },
  HIIT_EXPLOSIVO: {
    type: 'HIIT_EXPLOSIVO',
    label: 'HIIT Explosivo',
    description: 'Picos de intensidade alternados',
    intensityCurve: 'PICO_CENTRAL',
    bpmRange: [140, 190],
  },
  PILATES_ALONGAMENTO: {
    type: 'PILATES_ALONGAMENTO',
    label: 'Pilates / Alongamento',
    description: 'BPM baixo, vibe calma e constante',
    intensityCurve: 'CONSTANTE_BAIXA',
    bpmRange: [70, 110],
  },
  AQUECIMENTO_LEVE: {
    type: 'AQUECIMENTO_LEVE',
    label: 'Aquecimento Leve',
    description: 'Crescente suave até intensidade média',
    intensityCurve: 'CRESCENTE',
    bpmRange: [90, 130],
  },
  CROSSFIT: {
    type: 'CROSSFIT',
    label: 'CrossFit',
    description: 'Variação extrema, tudo no máximo',
    intensityCurve: 'PICO_CENTRAL',
    bpmRange: [135, 185],
  },
};
