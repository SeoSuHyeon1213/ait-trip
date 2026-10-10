import type { Mood } from '../domain/models/Destination';
export interface MoodTheme { label: string; description: string; filters: { lclsSystm1: string; lclsSystm2: string }; reason: string }
export const moodThemes: Record<Mood, MoodTheme>;
export function matchesMoodTheme(item: { lclsSystm1?: string; lclsSystm2?: string }, mood: Mood): boolean;
