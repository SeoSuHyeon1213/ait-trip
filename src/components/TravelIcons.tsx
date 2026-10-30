import type { Mood } from '../domain/models/Destination';

export function MoodIcon({ mood }: { mood: Mood }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {mood === 'rest' ? <path d="M13 29V18a7 7 0 1 1 6 0v11h-6Z" /> :
      mood === 'refresh' ? <><path d="M3 10c5 0 5-5 10-2s5 3 9 1 5 0 7 0M3 17c5 0 5-5 10-2s5 3 9 1 5 0 7 0M3 24c5 0 5-5 10-2s5 3 9 1 5 0 7 0" /></> :
      mood === 'explore' ? <><circle cx="16" cy="16" r="13" /><path d="m21 10-3 9-8 3 3-9 8-3Z" /></> :
      <><circle cx="12" cy="10" r="4" /><circle cx="23" cy="11" r="3.5" /><path d="M3 28c0-6 4-10 9-10s9 4 9 10M23 19c4 0 7 4 7 8" /></>}
  </svg>;
}

export function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>;
}

export function CheckIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

export function TravelerIcon() {
  return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="16" cy="10" r="5" /><path d="M6 29c0-7 4-11 10-11s10 4 10 11" /></svg>;
}
