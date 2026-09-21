import { InteractionManager } from "react-native";

export const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "flac", "wav", "ogg", "aac", "wma"]);
export const BATCH_SIZE = 50;
export const YIELD_EVERY_BATCH = true;
export const MAX_DURATION_SECONDS = 60 * 20;

export function hashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + "_" + input.length.toString(36);
}

export function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function waitForInteractions(): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
}
