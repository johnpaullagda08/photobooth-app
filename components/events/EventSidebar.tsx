'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Calendar,
  Plus,
  Trash2,
  Play,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Copy,
  PartyPopper,
  Cake,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PhotoboothEvent } from '@/lib/events/types';

interface EventSidebarProps {
  events: PhotoboothEvent[];
  activeEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onCreateEvent: (template: 'wedding' | 'birthday' | 'corporate', name?: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onDuplicateEvent: (eventId: string) => void;
  onLaunchEvent: (eventId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const templateIcons = {
  wedding: PartyPopper,
  birthday: Cake,
  corporate: Building2,
  custom: Calendar,
};

const templateColors = {
  wedding: 'text-pink-500',
  birthday: 'text-orange-500',
  corporate: 'text-blue-500',
  custom: 'text-gray-500',
};

export function EventSidebar({
  events,
  activeEventId,
  onSelectEvent,
  onCreateEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onLaunchEvent,
  isCollapsed,
  onToggleCollapse,
}: EventSidebarProps) {
  const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState('');
  const [newEventTemplate, setNewEventTemplate] = useState<'wedding' | 'birthday' | 'corporate'>('wedding');

  const handleCreateEvent = () => {
    onCreateEvent(newEventTemplate, newEventName || undefined);
    setShowNewEventDialog(false);
    setNewEventName('');
    setNewEventTemplate('wedding');
  };

  const handleDeleteConfirm = () => {
    if (showDeleteDialog) {
      onDeleteEvent(showDeleteDialog);
      setShowDeleteDialog(null);
    }
  };

  const eventToDelete = events.find((e) => e.id === showDeleteDialog);

  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 60 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-full border-r border-border bg-card flex flex-col"
      >
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-sm"
              >
                Events
              </motion.h2>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Event List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {events.map((event, index) => {
                const Icon = templateIcons[event.template] || templateIcons.custom;
                const colorClass = templateColors[event.template] || templateColors.custom;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      onClick={() => onSelectEvent(event.id)}
                      className={cn(
                        'group relative flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                        activeEventId === event.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
                          activeEventId === event.id ? 'bg-primary/20' : 'bg-muted'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', colorClass)} />
                      </div>

                      {!isCollapsed && (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {event.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.date), 'MMM d, yyyy')}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateEvent(event.id);
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteDialog(event.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {events.length === 0 && !isCollapsed && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No events yet.
                <br />
                Create your first event!
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-border space-y-2">
          {!isCollapsed ? (
            <>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowNewEventDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
              <Button
                className="w-full justify-start"
                disabled={!activeEventId}
                onClick={() => activeEventId && onLaunchEvent(activeEventId)}
              >
                <Play className="mr-2 h-4 w-4" />
                Launch Event
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                className="w-full"
                onClick={() => setShowNewEventDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="w-full"
                disabled={!activeEventId}
                onClick={() => activeEventId && onLaunchEvent(activeEventId)}
              >
                <Play className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* New Event Dialog */}
      <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Choose a template and name for your event.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input
                placeholder="Enter event name..."
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Template</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['wedding', 'birthday', 'corporate'] as const).map((template) => {
                  const Icon = templateIcons[template];
                  return (
                    <motion.button
                      key={template}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setNewEventTemplate(template)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                        newEventTemplate === template
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Icon className={cn('h-6 w-6', templateColors[template])} />
                      <span className="text-sm capitalize">{template}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{eventToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
