/**
 * Tela inicial - Demo do fluxo completo
 * Foco: componentes nativos leves, sem bibliotecas pesadas de UI
 */
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useMediaIndexer } from '@/hooks/useMediaIndexer';
import { WORKOUT_PROFILES, WorkoutType } from '@/types/track';
import { generateAndPlayWorkout } from '@/features/training/workoutService';

export default function Home() {
  const { progress, isIndexing, count, startIndexing } = useMediaIndexer(false);
  const [loadingWorkout, setLoadingWorkout] = useState<WorkoutType | null>(null);
  const [lastPlaylist, setLastPlaylist] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSelectWorkout = async (type: WorkoutType) => {
    setLoadingWorkout(type);
    setError(null);
    try {
      const res = await generateAndPlayWorkout(type);
      setLastPlaylist(`${res.playlistName} - ${res.orderedQueue.length} faixas (${Math.round(res.totalDurationSeconds / 60)} min)`);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoadingWorkout(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alta Performan</Text>
      <Text style={styles.subtitle}>Spotify Offline Smart • {count} músicas locais</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={startIndexing} disabled={isIndexing}>
        {isIndexing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Indexar Músicas Locais</Text>}
      </TouchableOpacity>

      {progress && (
        <Text style={styles.progress}>
          {progress.processed}/{progress.totalFound} • Lote {progress.currentBatch} • {progress.elapsedMs}ms
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
      {lastPlaylist && <Text style={styles.success}>✓ {lastPlaylist}</Text>}

      <Text style={styles.section}>Escolha o treino:</Text>
      <FlatList
        data={Object.values(WORKOUT_PROFILES)}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelectWorkout(item.type)} disabled={!!loadingWorkout}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
            <Text style={styles.cardMeta}>
              {item.intensityCurve} • {item.bpmRange[0]}-{item.bpmRange[1]} BPM
            </Text>
            {loadingWorkout === item.type && <ActivityIndicator style={{ marginTop: 8 }} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16, paddingTop: 48 },
  title: { color: '#1DB954', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#999', marginBottom: 16 },
  primaryBtn: { backgroundColor: '#1DB954', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  btnText: { color: '#000', fontWeight: '700' },
  progress: { color: '#666', fontSize: 12, marginBottom: 8 },
  error: { color: '#ff4444', marginBottom: 8 },
  success: { color: '#1DB954', marginBottom: 8 },
  section: { color: '#fff', fontWeight: '700', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: '#1a1a1a', padding: 14, borderRadius: 12, marginBottom: 10 },
  cardTitle: { color: '#fff', fontWeight: '700' },
  cardDesc: { color: '#999', fontSize: 12, marginTop: 2 },
  cardMeta: { color: '#666', fontSize: 11, marginTop: 4 },
});
