'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvents } from '@/lib/events/store';
import { EventSidebar } from '@/components/events/EventSidebar';
import { EventSettings } from '@/components/events/EventSettings';
import { KioskMode } from '@/components/kiosk/KioskMode';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Camera, FolderOpen } from 'lucide-react';
import type { PhotoboothEvent } from '@/lib/events/types';

export default function BoothPage() {
  const {
    events,
    activeEvent,
    activeEventId,
    isLoaded,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    selectEvent,
  } = useEvents();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [kioskEventId, setKioskEventId] = useState<string | null>(null);

  // Handle event update
  const handleUpdateEvent = useCallback(
    (updates: Partial<PhotoboothEvent>) => {
      if (activeEventId) {
        updateEvent(activeEventId, updates);
      }
    },
    [activeEventId, updateEvent]
  );

  // Launch event in kiosk mode
  const handleLaunchEvent = useCallback((eventId: string) => {
    setKioskEventId(eventId);
    setIsKioskMode(true);
  }, []);

  // Exit kiosk mode
  const handleExitKiosk = useCallback(() => {
    setIsKioskMode(false);
    setKioskEventId(null);
  }, []);

  // Get event for kiosk mode
  const kioskEvent = events.find((e) => e.id === kioskEventId);

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Camera className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  // Kiosk Mode
  if (isKioskMode && kioskEvent) {
    return <KioskMode event={kioskEvent} onExit={handleExitKiosk} />;
  }

  // Event Management Mode
  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <EventSidebar
        events={events}
        activeEventId={activeEventId}
        onSelectEvent={selectEvent}
        onCreateEvent={createEvent}
        onDeleteEvent={deleteEvent}
        onDuplicateEvent={duplicateEvent}
        onLaunchEvent={handleLaunchEvent}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Log the Photobooth</h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeEvent ? (
              <motion.div
                key={activeEvent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <EventSettings
                  event={activeEvent}
                  onUpdate={handleUpdateEvent}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-8"
              >
                <div className="p-6 rounded-full bg-muted mb-6">
                  <FolderOpen className="h-16 w-16 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">No Event Selected</h2>
                <p className="text-muted-foreground max-w-md">
                  Select an event from the sidebar to configure its settings, or create a new event to get started.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
