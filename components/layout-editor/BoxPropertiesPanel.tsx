'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Move, Maximize2, Tag, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BoxConfig } from '@/lib/events/types';

interface BoxPropertiesPanelProps {
  box: BoxConfig | null;
  onUpdate: (updates: Partial<BoxConfig>) => void;
  onDelete: () => void;
}

export function BoxPropertiesPanel({
  box,
  onUpdate,
  onDelete,
}: BoxPropertiesPanelProps) {
  if (!box) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Move className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a photo box to edit its properties</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={box.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Box Properties</CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
            <CardDescription>Edit {box.label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Label */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Label
              </Label>
              <Input
                value={box.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Photo label"
              />
            </div>

            {/* Position */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5" />
                Position
              </Label>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">X</span>
                    <span className="text-xs font-mono">{box.x.toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[box.x]}
                    min={0}
                    max={100 - box.width}
                    step={0.5}
                    onValueChange={([value]) => onUpdate({ x: value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Y</span>
                    <span className="text-xs font-mono">{box.y.toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[box.y]}
                    min={0}
                    max={100 - box.height}
                    step={0.5}
                    onValueChange={([value]) => onUpdate({ y: value })}
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5" />
                Size
              </Label>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Width</span>
                    <span className="text-xs font-mono">{box.width.toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[box.width]}
                    min={10}
                    max={100 - box.x}
                    step={0.5}
                    onValueChange={([value]) => onUpdate({ width: value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Height</span>
                    <span className="text-xs font-mono">{box.height.toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[box.height]}
                    min={10}
                    max={100 - box.y}
                    step={0.5}
                    onValueChange={([value]) => onUpdate({ height: value })}
                  />
                </div>
              </div>
            </div>

            {/* Precise Input */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">X %</Label>
                <Input
                  type="number"
                  value={box.x.toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onUpdate({ x: Math.max(0, Math.min(100 - box.width, val)) });
                  }}
                  className="h-8 text-xs"
                  step="0.5"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Y %</Label>
                <Input
                  type="number"
                  value={box.y.toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onUpdate({ y: Math.max(0, Math.min(100 - box.height, val)) });
                  }}
                  className="h-8 text-xs"
                  step="0.5"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">W %</Label>
                <Input
                  type="number"
                  value={box.width.toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onUpdate({ width: Math.max(10, Math.min(100 - box.x, val)) });
                  }}
                  className="h-8 text-xs"
                  step="0.5"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">H %</Label>
                <Input
                  type="number"
                  value={box.height.toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onUpdate({ height: Math.max(10, Math.min(100 - box.y, val)) });
                  }}
                  className="h-8 text-xs"
                  step="0.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
