import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn - helper leve para NativeWind
 * Mergeia classes tailwind sem conflito, com memo mínimo
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
