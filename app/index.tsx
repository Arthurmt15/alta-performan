import React, { useState } from "react";
import { View, FlatList, ActivityIndicator, ScrollView, Image } from "react-native";
import { useMediaIndexer } from "@/hooks/useMediaIndexer";
import { useEnrichTracks } from "@/hooks/useEnrichTracks";
import { WORKOUT_PROFILES, WorkoutType } from "@/types/track";
import { generateAndPlayWorkout } from "@/features/training/workoutService";
import { getAllTracks } from "@/core/database";
import { Card, Button, AppText, MutedText, Badge } from "@/components/ui";

export default function Home() {
  const { progress, isIndexing, count, startIndexing } = useMediaIndexer(false);
  const { enrich, isEnriching, progress: enrichProgress } = useEnrichTracks();
  const [loadingWorkout, setLoadingWorkout] = useState<WorkoutType | null>(null);
  const [lastPlaylist, setLastPlaylist] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrichedCount, setEnrichedCount] = useState<number>(0);

  const onSelectWorkout = async (type: WorkoutType) => {
    setLoadingWorkout(type);
    setError(null);
    try {
      const res = await generateAndPlayWorkout(type);
      setLastPlaylist(`${res.playlistName} • ${res.orderedQueue.length} faixas • ${Math.round(res.totalDurationSeconds / 60)} min`);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoadingWorkout(null);
    }
  };

  const onEnrich = async () => {
    const tracks = await getAllTracks();
    if (tracks.length === 0) {
      setError("Indexe músicas primeiro");
      return;
    }
    const map = await enrich(tracks.slice(0, 30)); // limita 30 para respeitar rate-limit
    setEnrichedCount(map.size);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      {/* Header */}
      <View className="mb-6">
        <AppText className="text-3xl font-extrabold text-primary">Alta Performan</AppText>
        <MutedText className="mt-1">Spotify Offline Smart • {count} músicas • {enrichedCount} enriquecidas</MutedText>
        <View className="flex-row gap-2 mt-2">
          <Badge>Groq LPU</Badge>
          <Badge>MusicBrainz</Badge>
          <Badge>TheAudioDB</Badge>
        </View>
      </View>

      {/* Actions */}
      <View className="gap-3 mb-4">
        <Button onPress={startIndexing} loading={isIndexing}>
          <AppText className="text-black font-bold">{isIndexing ? "Indexando..." : "Indexar Músicas Locais"}</AppText>
        </Button>
        <Button variant="secondary" onPress={onEnrich} loading={isEnriching}>
          <AppText className="text-white font-bold">{isEnriching ? "Enriquecendo..." : "Enriquecer com MusicBrainz + AudioDB"}</AppText>
        </Button>
      </View>

      {progress && (
        <MutedText className="text-xs mb-2">
          {progress.processed}/{progress.totalFound} • Lote {progress.currentBatch} • {progress.elapsedMs}ms
        </MutedText>
      )}
      {enrichProgress && (
        <MutedText className="text-xs mb-2">
          Enriquecendo {enrichProgress.done}/{enrichProgress.total}
        </MutedText>
      )}
      {error && <AppText className="text-red-500 mb-2">{error}</AppText>}
      {lastPlaylist && <AppText className="text-primary mb-2">✓ {lastPlaylist}</AppText>}

      {/* Workout Grid */}
      <AppText className="font-bold mt-4 mb-3 text-base">Escolha o treino:</AppText>
      <View className="gap-3 pb-8">
        {Object.values(WORKOUT_PROFILES).map((item) => (
          <Card key={item.type} className="active:opacity-80">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <AppText className="font-bold text-base">{item.label}</AppText>
                <MutedText className="mt-1">{item.description}</MutedText>
                <View className="flex-row gap-2 mt-2">
                  <Badge>{item.intensityCurve}</Badge>
                  <Badge>
                    {item.bpmRange[0]}-{item.bpmRange[1]} BPM
                  </Badge>
                </View>
              </View>
              {loadingWorkout === item.type && <ActivityIndicator color="#1DB954" />}
            </View>
            <Button
              size="sm"
              className="mt-3"
              onPress={() => onSelectWorkout(item.type as WorkoutType)}
              disabled={!!loadingWorkout}
            >
              <AppText className="text-black font-bold text-sm">Gerar Playlist IA</AppText>
            </Button>
          </Card>
        ))}
      </View>

      <MutedText className="text-center text-xs text-mutedDark mt-4">
        Estilo: NativeWind (Tailwind compile-time) • APIs: MusicBrainz (sem chave) + TheAudioDB (key 123) • Cache MMKV
      </MutedText>
    </ScrollView>
  );
}
