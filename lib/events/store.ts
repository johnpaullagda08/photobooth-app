'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PhotoboothEvent, PaperSize } from './types';
import { createDefaultEvent } from './types';

const STORAGE_KEY = 'photobooth_events';
const ACTIVE_EVENT_KEY = 'photobooth_active_event';

// Migrate legacy events to add missing fields
function migrateEvent(event: Partial<PhotoboothEvent>): PhotoboothEvent {
  // Add default paperSize if missing (legacy events)
  if (!event.paperSize) {
    event.paperSize = 'strip';
  }
  // Add default orientation if missing (legacy events)
  // Strip is always portrait, 4R defaults to portrait
  if (!event.orientation) {
    event.orientation = 'portrait';
  }
  // Ensure printing config exists and has showCutMarks
  if (!event.printing) {
    event.printing = {
      paperSize: '4x6',
      printOutput: 'double-strip',
      copies: 1,
      autoPrint: false,
      quality: 'high',
      showCutMarks: true,
      colorCorrection: {
        enabled: false,
        brightness: 0,
        contrast: 0,
        saturation: 0,
      },
      printerProfile: null,
    };
  } else if (event.printing.showCutMarks === undefined) {
    // Add showCutMarks if missing from existing printing config
    event.printing.showCutMarks = true;
  }
  return event as PhotoboothEvent;
}

// Get events from localStorage
export function getEventsFromStorage(): PhotoboothEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const rawEvents = JSON.parse(data) as Partial<PhotoboothEvent>[];
    // Migrate and sort by date descending
    const events = rawEvents.map(migrateEvent);
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Failed to load events:', error);
    return [];
  }
}

// Save events to localStorage
export function saveEventsToStorage(events: PhotoboothEvent[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save events:', error);
  }
}

// Get active event ID
export function getActiveEventId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_EVENT_KEY);
}

// Set active event ID
export function setActiveEventId(eventId: string | null): void {
  if (typeof window === 'undefined') return;

  if (eventId) {
    localStorage.setItem(ACTIVE_EVENT_KEY, eventId);
  } else {
    localStorage.removeItem(ACTIVE_EVENT_KEY);
  }
}

// Custom hook for managing events
export function useEvents() {
  const [events, setEvents] = useState<PhotoboothEvent[]>([]);
  const [activeEventId, setActiveId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load events on mount
  useEffect(() => {
    const loadedEvents = getEventsFromStorage();
    const activeId = getActiveEventId();
    setEvents(loadedEvents);
    setActiveId(activeId);
    setIsLoaded(true);
  }, []);

  // Get active event
  const activeEvent = events.find((e) => e.id === activeEventId) || null;

  // Create new event
  const createEvent = useCallback(
    (paperSize: PaperSize = 'strip', name?: string) => {
      const newEvent = createDefaultEvent(paperSize);
      if (name) {
        newEvent.name = name;
      }

      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      saveEventsToStorage(updatedEvents);
      setActiveId(newEvent.id);
      setActiveEventId(newEvent.id);

      return newEvent;
    },
    [events]
  );

  // Update event
  const updateEvent = useCallback(
    (eventId: string, updates: Partial<PhotoboothEvent>) => {
      const updatedEvents = events.map((event) =>
        event.id === eventId
          ? { ...event, ...updates, updatedAt: Date.now() }
          : event
      );
      setEvents(updatedEvents);
      saveEventsToStorage(updatedEvents);
    },
    [events]
  );

  // Delete event
  const deleteEvent = useCallback(
    (eventId: string) => {
      const updatedEvents = events.filter((e) => e.id !== eventId);
      setEvents(updatedEvents);
      saveEventsToStorage(updatedEvents);

      // If deleted event was active, clear active
      if (activeEventId === eventId) {
        setActiveId(null);
        setActiveEventId(null);
      }
    },
    [events, activeEventId]
  );

  // Duplicate event
  const duplicateEvent = useCallback(
    (eventId: string) => {
      const eventToDuplicate = events.find((e) => e.id === eventId);
      if (!eventToDuplicate) return null;

      const now = Date.now();
      const newEvent: PhotoboothEvent = {
        ...JSON.parse(JSON.stringify(eventToDuplicate)),
        id: crypto.randomUUID ? crypto.randomUUID() : `event-${now}`,
        name: `${eventToDuplicate.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
      };

      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      saveEventsToStorage(updatedEvents);

      return newEvent;
    },
    [events]
  );

  // Select event
  const selectEvent = useCallback((eventId: string | null) => {
    setActiveId(eventId);
    setActiveEventId(eventId);
  }, []);

  // Get event by ID
  const getEvent = useCallback(
    (eventId: string) => {
      return events.find((e) => e.id === eventId) || null;
    },
    [events]
  );

  return {
    events,
    activeEvent,
    activeEventId,
    isLoaded,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    selectEvent,
    getEvent,
  };
}

// Export individual event config updaters
export function updateLaunchPage(
  event: PhotoboothEvent,
  updates: Partial<PhotoboothEvent['launchPage']>
): PhotoboothEvent {
  return {
    ...event,
    launchPage: { ...event.launchPage, ...updates },
    updatedAt: Date.now(),
  };
}

export function updateCamera(
  event: PhotoboothEvent,
  updates: Partial<PhotoboothEvent['camera']>
): PhotoboothEvent {
  return {
    ...event,
    camera: { ...event.camera, ...updates },
    updatedAt: Date.now(),
  };
}

export function updateCountdown(
  event: PhotoboothEvent,
  updates: Partial<PhotoboothEvent['countdown']>
): PhotoboothEvent {
  return {
    ...event,
    countdown: { ...event.countdown, ...updates },
    updatedAt: Date.now(),
  };
}

export function updatePrintLayout(
  event: PhotoboothEvent,
  updates: Partial<PhotoboothEvent['printLayout']>
): PhotoboothEvent {
  return {
    ...event,
    printLayout: { ...event.printLayout, ...updates },
    updatedAt: Date.now(),
  };
}

export function updatePrinting(
  event: PhotoboothEvent,
  updates: Partial<PhotoboothEvent['printing']>
): PhotoboothEvent {
  return {
    ...event,
    printing: { ...event.printing, ...updates },
    updatedAt: Date.now(),
  };
}

export function updatePrinter(
  event: PhotoboothEvent,
  updates: Partial<PhotoboothEvent['printer']>
): PhotoboothEvent {
  return {
    ...event,
    printer: { ...event.printer, ...updates },
    updatedAt: Date.now(),
  };
}
