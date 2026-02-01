'use client';

import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Palette,
  Camera,
  Timer,
  Layout,
  Printer,
  Settings2,
  Calendar,
} from 'lucide-react';
import type { PhotoboothEvent } from '@/lib/events/types';
import { LaunchPageBuilder } from './tabs/LaunchPageBuilder';
import { CameraSetup } from './tabs/CameraSetup';
import { CountdownSettings } from './tabs/CountdownSettings';
import { PrintLayoutSettings } from './tabs/PrintLayoutSettings';
import { PrintingSettings } from './tabs/PrintingSettings';
import { PrinterSetup } from './tabs/PrinterSetup';

interface EventSettingsProps {
  event: PhotoboothEvent;
  onUpdate: (updates: Partial<PhotoboothEvent>) => void;
}

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function EventSettings({ event, onUpdate }: EventSettingsProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Event Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <Input
              value={event.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="text-lg font-semibold h-auto py-1 px-2 border-transparent hover:border-border focus:border-primary"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <Input
                type="date"
                value={event.date}
                onChange={(e) => onUpdate({ date: e.target.value })}
                className="h-auto py-0.5 px-2 w-auto border-transparent hover:border-border"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="launch-page" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
          <TabsTrigger
            value="launch-page"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <Palette className="h-4 w-4 mr-2" />
            Launch Page
          </TabsTrigger>
          <TabsTrigger
            value="camera"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </TabsTrigger>
          <TabsTrigger
            value="countdown"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <Timer className="h-4 w-4 mr-2" />
            Countdown
          </TabsTrigger>
          <TabsTrigger
            value="print-layout"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <Layout className="h-4 w-4 mr-2" />
            Print Layout
          </TabsTrigger>
          <TabsTrigger
            value="printing"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Printing
          </TabsTrigger>
          <TabsTrigger
            value="printer"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            <Printer className="h-4 w-4 mr-2" />
            Printer
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="launch-page" className="h-full m-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tabVariants}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <LaunchPageBuilder
                config={event.launchPage}
                onUpdate={(launchPage) => onUpdate({ launchPage })}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="camera" className="h-full m-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tabVariants}
              transition={{ duration: 0.2 }}
              className="h-full p-4"
            >
              <CameraSetup
                config={event.camera}
                onUpdate={(camera) => onUpdate({ camera })}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="countdown" className="h-full m-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tabVariants}
              transition={{ duration: 0.2 }}
              className="h-full p-4"
            >
              <CountdownSettings
                config={event.countdown}
                onUpdate={(countdown) => onUpdate({ countdown })}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="print-layout" className="h-full m-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tabVariants}
              transition={{ duration: 0.2 }}
              className="h-full p-4"
            >
              <PrintLayoutSettings
                config={event.printLayout}
                onUpdate={(printLayout) => onUpdate({ printLayout })}
                paperSize={event.paperSize}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="printing" className="h-full m-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tabVariants}
              transition={{ duration: 0.2 }}
              className="h-full p-4"
            >
              <PrintingSettings
                config={event.printing}
                onUpdate={(printing) => onUpdate({ printing })}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="printer" className="h-full m-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tabVariants}
              transition={{ duration: 0.2 }}
              className="h-full p-4"
            >
              <PrinterSetup
                config={event.printer}
                onUpdate={(printer) => onUpdate({ printer })}
              />
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
