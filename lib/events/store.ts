'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PhotoboothEvent } from './types';
import { createDefaultEvent } from './types';

const STORAGE_KEY = 'photobooth_events';
const ACTIVE_EVENT_KEY = 'photobooth_active_event';

// Get events from localStorage
export function getEventsFromStorage(): PhotoboothEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const events = JSON.parse(data) as PhotoboothEvent[];
    // Sort by date descending
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
    (template: 'wedding' | 'birthday' | 'corporate' = 'wedding', name?: string) => {
      const newEvent = createDefaultEvent(template);
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
