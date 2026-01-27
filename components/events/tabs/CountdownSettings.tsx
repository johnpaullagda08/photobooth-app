'use client';

import { motion } from 'framer-motion';
import { Timer, Volume2, VolumeX, Sparkles, Camera, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CountdownConfig } from '@/lib/events/types';

interface CountdownSettingsProps {
  config: CountdownConfig;
  onUpdate: (config: CountdownConfig) => void;
}

const durationOptions = [3, 5, 8, 10] as const;

export function CountdownSettings({ config, onUpdate }: CountdownSettingsProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Enable Countdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Countdown Timer</CardTitle>
              <CardDescription>Enable countdown before photo capture</CardDescription>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => onUpdate({ ...config, enabled: checked })}
            />
          </div>
        </CardHeader>
      </Card>

      {config.enabled && (
        <>
          {/* Duration Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Duration</CardTitle>
              <CardDescription>Select countdown duration in seconds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {durationOptions.map((duration) => (
                  <motion.button
                    key={duration}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onUpdate({ ...config, duration })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 p-4 rounded-lg border-2 transition-colors',
                      config.duration === duration
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Timer className="h-5 w-5" />
                    <span className="text-2xl font-bold">{duration}</span>
                    <span className="text-xs text-muted-foreground">seconds</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* When to Show Countdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Countdown Triggers</CardTitle>
              <CardDescription>Choose when to show the countdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <Label>Before Capture</Label>
                    <p className="text-sm text-muted-foreground">
                      Show countdown before each photo is taken
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.beforeCapture}
                  onCheckedChange={(checked) => onUpdate({ ...config, beforeCapture: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <Label>Before Print</Label>
                    <p className="text-sm text-muted-foreground">
                      Show countdown before printing starts
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.beforePrint}
                  onCheckedChange={(checked) => onUpdate({ ...config, beforePrint: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Visual and Sound Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Effects</CardTitle>
              <CardDescription>Customize countdown appearance and sounds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <Label>Animation</Label>
                    <p className="text-sm text-muted-foreground">
                      Show animated countdown numbers
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.showAnimation}
                  onCheckedChange={(checked) => onUpdate({ ...config, showAnimation: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    {config.soundEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <Label>Sound</Label>
                    <p className="text-sm text-muted-foreground">
                      Play beep sound during countdown
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.soundEnabled}
                  onCheckedChange={(checked) => onUpdate({ ...config, soundEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                <motion.div
                  key={config.duration}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-8xl font-bold text-primary"
                >
                  {config.duration}
                </motion.div>
                {config.showAnimation && (
                  <motion.div
                    className="absolute inset-0 border-4 border-primary rounded-lg"
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
