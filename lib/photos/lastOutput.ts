'use client';

const LAST_OUTPUT_KEY = 'photobooth_last_output';

export interface LastPhotoOutput {
  eventId: string;
  photos: string[]; // base64 data URLs
  compositeImage: string | null; // final composed image
  timestamp: number;
}

export function getLastOutput(): LastPhotoOutput | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(LAST_OUTPUT_KEY);
    if (!data) return null;
    return JSON.parse(data) as LastPhotoOutput;
  } catch {
    return null;
  }
}

export function saveLastOutput(output: LastPhotoOutput): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LAST_OUTPUT_KEY, JSON.stringify(output));
  } catch (error) {
    console.error('Failed to save last output:', error);
  }
}

export function clearLastOutput(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LAST_OUTPUT_KEY);
}
