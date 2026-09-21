/**
 * MMKV - armazenamento chave-valor ultrarrápido (C++ JSI)
 * 30x mais rápido que AsyncStorage, zero serialização bloqueante para ops simples
 */
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'alta-performan-storage',
  encryptionKey: undefined, // opcional: derive de device id se precisar
});

// Helpers tipados com JSON
export const kv = {
  getString: (key: string) => storage.getString(key) ?? null,
  setString: (key: string, value: string) => storage.set(key, value),
  getNumber: (key: string) => {
    const v = storage.getString(key);
    return v ? Number(v) : null;
  },
  setNumber: (key: string, value: number) => storage.set(key, String(value)),
  getBoolean: (key: string) => storage.getBoolean(key) ?? null,
  setBoolean: (key: string, value: boolean) => storage.set(key, value),
  getObject: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setObject: (key: string, value: unknown) => storage.set(key, JSON.stringify(value)),
  remove: (key: string) => storage.delete(key),
  clear: () => storage.clearAll(),
};

// Chaves centralizadas
export const STORAGE_KEYS = {
  LAST_INDEXED_AT: 'last_indexed_at',
  LAST_GROQ_RESPONSE: 'last_groq_response',
  GROQ_API_KEY: 'groq_api_key', // setar via env ou input seguro
  PENDING_PLAYLIST: 'pending_playlist_queue',
} as const;
