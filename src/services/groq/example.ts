/**
 * example.ts - Exemplo de chamada Groq com JSON Schema estrito
 * ------------------------------------------------------------
 * 1) curl equivalente
 * 2) payload TypeScript
 * 3) resposta esperada
 */

/*
CURL - Teste direto (substitua $GROQ_API_KEY):

curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instant",
    "temperature": 0.3,
    "max_tokens": 4000,
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "workout_playlist",
        "strict": true,
        "schema": {
          "type": "object",
          "additionalProperties": false,
          "required": ["workoutType","playlistName","totalDurationSeconds","curve","categories","orderedQueue"],
          "properties": {
            "workoutType": {"type": "string"},
            "playlistName": {"type": "string"},
            "totalDurationSeconds": {"type": "integer"},
            "curve": {"type": "string", "enum": ["CRESCENTE","DECRESCENTE","PICO_CENTRAL","CONSTANTE_ALTA","CONSTANTE_BAIXA"]},
            "categories": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["name","vibe","trackIds"],
                "properties": {
                  "name": {"type": "string"},
                  "vibe": {"type": "string"},
                  "trackIds": {"type": "array", "items": {"type": "string"}}
                }
              }
            },
            "orderedQueue": {
              "type": "array",
              "minItems": 5,
              "maxItems": 50,
              "items": {
                "type":"object",
                "additionalProperties": false,
                "required": ["id","position","reason","energyLevel","estimatedBpm"],
                "properties": {
                  "id": {"type":"string"},
                  "position": {"type":"integer", "minimum":1},
                  "reason": {"type":"string"},
                  "energyLevel": {"type":"integer", "minimum":1, "maximum":5},
                  "estimatedBpm": {"type":"integer", "minimum":60, "maximum":220}
                }
              }
            },
            "fallbackMessage": {"type":"string"}
          }
        }
      }
    },
    "messages": [
      {"role":"system","content":"Você é um DJ especialista em treino..."},
      {"role":"user","content":"{\"workoutType\":\"MUSCULACAO_HEAVY\",\"tracks\":[...]}"}
    ]
  }'
*/

// ============ PAYLOAD TYPESCRIPT ============
export const EXAMPLE_PAYLOAD = {
  model: 'llama-3.1-8b-instant',
  temperature: 0.3,
  max_tokens: 4000,
  response_format: {
    type: 'json_schema' as const,
    json_schema: {
      name: 'workout_playlist',
      strict: true,
      schema: {
        type: 'object',
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
            items: {
              type: 'object',
              required: ['id', 'position', 'reason', 'energyLevel', 'estimatedBpm'],
              properties: {
                id: { type: 'string' },
                position: { type: 'integer' },
                reason: { type: 'string' },
                energyLevel: { type: 'integer' },
                estimatedBpm: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
  messages: [
    {
      role: 'system' as const,
      content:
        'Você é um DJ especialista em treino. Categorize e ordene faixas por BPM/energia para o treino pedido. Responda ESTRITAMENTE no JSON Schema.',
    },
    {
      role: 'user' as const,
      content: JSON.stringify(
        {
          workoutType: 'CORRIDA_CARDIO',
          workoutLabel: 'Corrida Cardio',
          intensityCurve: 'CRESCENTE',
          bpmRange: [120, 180],
          totalTracksAvailable: 8,
          tracks: [
            { id: 'a1', title: 'HUMBLE.', artist: 'Kendrick Lamar', album: 'DAMN.', duration: 177, genre: 'Hip-Hop' },
            { id: 'a2', title: 'Enter Sandman', artist: 'Metallica', album: 'Metallica', duration: 331, genre: 'Metal' },
            { id: 'a3', title: 'Titanium', artist: 'David Guetta ft Sia', album: 'Nothing But The Beat', duration: 245, genre: 'Eletrônica' },
            { id: 'a4', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: 203, genre: 'Synth-pop' },
            { id: 'a5', title: 'Lose Yourself', artist: 'Eminem', album: '8 Mile', duration: 326, genre: 'Hip-Hop' },
            { id: 'a6', title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', duration: 203, genre: 'Pop' },
            { id: 'a7', title: 'Stronger', artist: 'The Score', album: 'Unstoppable', duration: 210, genre: 'Rock' },
            { id: 'a8', title: 'Weightless', artist: 'Marconi Union', album: 'Ambient', duration: 480, genre: 'Ambient' },
          ],
        },
        null,
        2
      ),
    },
  ],
};

// ============ RESPOSTA ESPERADA ============
export const EXAMPLE_RESPONSE = {
  workoutType: 'CORRIDA_CARDIO',
  playlistName: 'Corrida Cardio - Ascensão Progressiva',
  totalDurationSeconds: 1695,
  curve: 'CRESCENTE',
  categories: [
    { name: 'Aquecimento', vibe: 'Leve e Motivacional', trackIds: ['a6', 'a4'] },
    { name: 'Ritmo Cardio', vibe: 'Energético', trackIds: ['a1', 'a5', 'a3'] },
    { name: 'Pico Final', vibe: 'Intenso / Agressivo', trackIds: ['a7', 'a2'] },
  ],
  orderedQueue: [
    { id: 'a6', position: 1, reason: 'BPM 105 aquecimento leve', energyLevel: 2, estimatedBpm: 103 },
    { id: 'a4', position: 2, reason: 'Transição 115 BPM', energyLevel: 3, estimatedBpm: 116 },
    { id: 'a1', position: 3, reason: 'Hip-Hop 150 cadência corrida', energyLevel: 4, estimatedBpm: 150 },
    { id: 'a5', position: 4, reason: 'Flow intenso mantendo ritmo', energyLevel: 4, estimatedBpm: 155 },
    { id: 'a3', position: 5, reason: 'Eletrônica 128 pico controlado', energyLevel: 4, estimatedBpm: 128 },
    { id: 'a7', position: 6, reason: 'Rock 160 explosão', energyLevel: 5, estimatedBpm: 160 },
    { id: 'a2', position: 7, reason: 'Metal 175 final máximo', energyLevel: 5, estimatedBpm: 175 },
  ],
};

// Como chamar no app:
// import { generateWorkoutPlaylist } from '@/services/groq/groqClient';
// const result = await generateWorkoutPlaylist(tracks, 'CORRIDA_CARDIO');
// validated via Zod GroqPlaylistResponseSchema
