/**
 * useMediaIndexer - Hook leve que NÃO trava a UI
 * Usa o indexer em chunks + Zustand/MM KV para estado
 */
import { useEffect, useState, useCallback } from 'react';
import { indexLocalTracks, IndexingProgress } from '@/services/indexing/mediaIndexer';
import { getAllTracks, getTrackCount } from '@/core/database';

export function useMediaIndexer(autoStart = false) {
  const [progress, setProgress] = useState<IndexingProgress | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  const refreshCount = useCallback(async () => {
    const c = await getTrackCount();
    setCount(c);
  }, []);

  const startIndexing = useCallback(async () => {
    setIsIndexing(true);
    setError(null);
    try {
      await indexLocalTracks({
        onProgress: setProgress,
        onError: (e) => setError(String(e)),
      });
      await refreshCount();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setIsIndexing(false);
    }
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();
    if (autoStart) startIndexing();
  }, [autoStart, refreshCount, startIndexing]);

  return { progress, isIndexing, error, count, startIndexing, refreshCount, getAllTracks };
}
