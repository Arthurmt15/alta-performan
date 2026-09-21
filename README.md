# Alta Performan — Spotify Offline Smart

App mobile **leve** para dispositivo de baixo desempenho: organiza músicas locais/baixadas e gera playlists de treino com IA via **Groq (llama-3.1-8b-instant)**.

> **Princípio**: IA não processa áudio. Apenas **metadados ID3** (título, artista, álbum, duração, gênero) → envio mínimo, latência ~300ms.

## Stack Leve Escolhida

| Camada | Lib | Por quê (dispositivo fraco) |
|---|---|---|
| Framework | **Expo ~52 + prebuild (Bare)** | Compilado nativo, sem bridge extra, OTA opcional |
| Navegação | `expo-router` | File-based, lazy, sem overhead |
| Banco local | `expo-sqlite` (WAL) + `react-native-mmkv` | WAL = leitura não bloqueia escrita; MMKV = 30x mais rápido que AsyncStorage (JSI) |
| Player | `react-native-track-player` 4.1 | Serviço foreground nativo, notificação/lock screen, zero WebView |
| Metadados | `expo-media-library` + `jsmediatags` (lazy) | MediaStore já indexado pelo SO, só header ID3 |
| Estado | `zustand` | 1kb, sem Context re-renders |
| Validação | `zod` | Valida resposta Groq em runtime |

**Evitar**: bibliotecas pesadas de UI (react-native-paper, native-base), ORMs (WatermelonDB overkill para MVP), reanimated pesado.

## Arquitetura de Pastas

```
src/
  core/
    database/      # expo-sqlite schema + queries (SQL puro, prepared statements)
    storage/       # MMKV tipado
  services/
    indexing/      # mediaIndexer.ts - chunk + yield (não trava UI)
    groq/          # groqClient.ts + example.ts (JSON Schema strict)
    audio/         # playerService.ts (TrackPlayer)
  features/
    library/       # listagem local
    training/      # workoutService (orquestra Groq -> fila)
  hooks/           # useMediaIndexer
  types/           # track.ts, groq.ts (Zod)
  constants/
  utils/
app/
  index.tsx        # tela demo
index.ts           # registerPlaybackService
```

## Fluxo

1. `indexLocalTracks()` → `expo-media-library.getAssetsAsync` paginado + yield a cada batch (50) → `upsertTracksBatch` transação WAL
2. Usuário escolhe `WorkoutType` → `generateWorkoutPlaylist(metadados, tipo)` → Groq `response_format: json_schema` (strict)
3. Zod valida → filtra IDs inválidos → calcula duração → cache MMKV
4. `createQueueFromGroqResponse()` → `TrackPlayer.reset/add` (file://) + persiste `playlists`/`playlist_tracks` → `play()`

## Exemplo Groq — Envio Eficiente

Ver `src/services/groq/example.ts` e `src/services/groq/groqClient.ts:42`.

**Payload (só metadados, ~200 bytes por faixa):**
```json
{
  "workoutType": "CORRIDA_CARDIO",
  "tracks": [
    { "id": "a1", "title": "HUMBLE.", "artist": "Kendrick Lamar", "album": "DAMN.", "duration": 177, "genre": "Hip-Hop" }
  ]
}
```

**Uso:**
```ts
import { generateWorkoutPlaylist } from '@/services/groq/groqClient';
import { getAllTracks } from '@/core/database';

const tracks = await getAllTracks();
const playlist = await generateWorkoutPlaylist(tracks, 'MUSCULACAO_HEAVY');
// playlist.orderedQueue -> [{ id, position, reason, energyLevel, estimatedBpm }]
```

**Curl:**
```bash
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
 -H "Authorization: Bearer $GROQ_API_KEY" \
 -H "Content-Type: application/json" \
 -d @src/services/groq/example.ts # ver EXAMPLE_PAYLOAD
```

## Trecho Crítico: Indexação sem travar UI

`src/services/indexing/mediaIndexer.ts:120`

```ts
await InteractionManager.runAfterInteractions(...);
for (let i = 0; i < tracks.length; i += 50) {
  await upsertTracksBatch(batch);
  onProgress?.({...});
  await new Promise(r => setTimeout(r, 0)); // yieldToUI
}
```

- `BATCH_SIZE=50`, `yieldToUI()` entre lotes libera event loop
- `expo-sqlite` com `PRAGMA journal_mode=WAL` → escrita paralela
- Hook `useMediaIndexer` expõe `progress` para UI reativa sem bloquear

## Rodar

```bash
npm install
npx expo prebuild
npx expo run:android # ou run:ios
# configurar GROQ_API_KEY em .env ou MMKV:
# kv.setString('groq_api_key', 'gsk_...')
```

## Otimizações para Device Fraco

- `max_tokens: 4000`, `temperature: 0.3` → resposta curta determinística
- `MAX_TRACKS_PER_REQUEST=120` → evita estouro de context/tokens
- `progressUpdateEventInterval: 1` no player → menos wakeups
- `shouldEnrich=false` por padrão (jsmediatags só se necessário)
- Imagens/artworks lazy, FlatList com `getItemLayout` se lista grande
```

## Próximos Passos

- Adicionar `getItemLayout` e `FlashList` se >500 faixas
- Estimativa real de BPM com `essentia.js` WASM off-thread (opcional, pesado)
- Sync incremental: só indexa `creationTime > last_indexed_at`
