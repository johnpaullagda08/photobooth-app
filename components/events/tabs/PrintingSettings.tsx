'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileImage,
  Copy,
  Zap,
  Gauge,
  CheckCircle2,
  Scissors,
  Palette,
  SunMedium,
  Contrast,
  Droplets,
  TestTube,
  Printer,
  History,
  Settings2,
  LayoutGrid,
  Columns,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { PrintingConfig } from '@/lib/events/types';

interface PrintingSettingsProps {
  config: PrintingConfig;
  onUpdate: (config: PrintingConfig) => void;
}

const paperSizeOptions = [
  { value: '4x6', label: '4x6 inch', description: 'Standard photobooth size' },
  { value: '5x7', label: '5x7 inch', description: 'Medium format' },
  { value: '6x8', label: '6x8 inch', description: 'Large format' },
] as const;

const printOutputOptions = [
  { value: 'single', label: 'Single Strip', description: '1 strip per page', icon: LayoutGrid },
  { value: 'double-strip', label: '2x Strip', description: '2 strips side-by-side on 4x6', icon: Columns },
] as const;

const qualityOptions = [
  { value: 'draft', label: 'Draft', description: 'Fast print, lower quality', icon: Zap },
  { value: 'normal', label: 'Normal', description: 'Balanced speed and quality', icon: Gauge },
  { value: 'high', label: 'High', description: 'Best quality, slower print', icon: CheckCircle2 },
] as const;

// Default color correction values for backwards compatibility
const DEFAULT_COLOR_CORRECTION = {
  enabled: false,
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

export function PrintingSettings({ config, onUpdate }: PrintingSettingsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Ensure colorCorrection exists with defaults for backwards compatibility
  const colorCorrection = config.colorCorrection ?? DEFAULT_COLOR_CORRECTION;

  // Ensure other new fields have defaults for backwards compatibility
  const printOutput = config.printOutput ?? 'double-strip';
  const showCutMarks = config.showCutMarks ?? true;

  // Handle color correction updates
  const updateColorCorrection = (key: keyof typeof colorCorrection, value: number | boolean) => {
    onUpdate({
      ...config,
      colorCorrection: {
        ...colorCorrection,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Print Output Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Print Output</CardTitle>
          <CardDescription>How to print the 2x6 photo strip</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {printOutputOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onUpdate({ ...config, printOutput: option.value })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors text-center',
                    printOutput === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </motion.button>
              );
            })}
          </div>
          {printOutput === 'double-strip' && (
            <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted rounded-lg">
              Two 2x6 strips will be printed side-by-side on 4x6 paper, giving guests 2 copies to keep or share.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Paper Size */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paper Size</CardTitle>
          <CardDescription>Select the print paper dimensions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {paperSizeOptions.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onUpdate({ ...config, paperSize: option.value })}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors text-center',
                  config.paperSize === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <FileImage className="h-6 w-6" />
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Print Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Print Quality</CardTitle>
          <CardDescription>Choose print quality level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {qualityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onUpdate({ ...config, quality: option.value })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors text-center',
                    config.quality === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Number of Copies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Copies</CardTitle>
          <CardDescription>Number of copies to print per session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-md bg-muted">
              <Copy className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min={1}
                max={10}
                value={config.copies}
                onChange={(e) =>
                  onUpdate({ ...config, copies: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })
                }
                className="w-24"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {config.copies === 1 ? 'copy' : 'copies'} per session
            </span>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((num) => (
              <motion.button
                key={num}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onUpdate({ ...config, copies: num })}
                className={cn(
                  'w-10 h-10 rounded-lg border-2 font-medium transition-colors',
                  config.copies === num
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {num}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto Print & Cut Marks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Print Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Auto Print
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically print after capture is complete
              </p>
            </div>
            <Switch
              checked={config.autoPrint}
              onCheckedChange={(checked) => onUpdate({ ...config, autoPrint: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Cut Marks
              </Label>
              <p className="text-sm text-muted-foreground">
                Show cut lines for easy trimming
              </p>
            </div>
            <Switch
              checked={showCutMarks}
              onCheckedChange={(checked) => onUpdate({ ...config, showCutMarks: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Color Correction (Pro Feature) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color Correction
              </CardTitle>
              <CardDescription>Adjust colors before printing</CardDescription>
            </div>
            <Switch
              checked={colorCorrection.enabled}
              onCheckedChange={(checked) => updateColorCorrection('enabled', checked)}
            />
          </div>
        </CardHeader>
        {colorCorrection.enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <SunMedium className="h-4 w-4" />
                Brightness: {colorCorrection.brightness > 0 ? '+' : ''}{colorCorrection.brightness}
              </Label>
              <Slider
                value={[colorCorrection.brightness]}
                min={-100}
                max={100}
                step={5}
                onValueChange={([value]) => updateColorCorrection('brightness', value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Contrast className="h-4 w-4" />
                Contrast: {colorCorrection.contrast > 0 ? '+' : ''}{colorCorrection.contrast}
              </Label>
              <Slider
                value={[colorCorrection.contrast]}
                min={-100}
                max={100}
                step={5}
                onValueChange={([value]) => updateColorCorrection('contrast', value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4" />
                Saturation: {colorCorrection.saturation > 0 ? '+' : ''}{colorCorrection.saturation}
              </Label>
              <Slider
                value={[colorCorrection.saturation]}
                min={-100}
                max={100}
                step={5}
                onValueChange={([value]) => updateColorCorrection('saturation', value)}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onUpdate({
                  ...config,
                  colorCorrection: { ...colorCorrection, brightness: 0, contrast: 0, saturation: 0 },
                })
              }
            >
              Reset to Default
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Advanced Settings (Collapsible) */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription>Printer profiles and additional options</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  {showAdvanced ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Printer Profile */}
              <div className="space-y-2">
                <Label className="text-sm">Printer Color Profile (ICC)</Label>
                <select
                  value={config.printerProfile || ''}
                  onChange={(e) => onUpdate({ ...config, printerProfile: e.target.value || null })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Default (sRGB)</option>
                  <option value="adobe-rgb">Adobe RGB</option>
                  <option value="prophoto-rgb">ProPhoto RGB</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Select the color profile that matches your printer for accurate colors
                </p>
              </div>

              {/* Test Print */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    Test Print
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Print a test page to verify settings
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Print Test
                </Button>
              </div>

              {/* Print History */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Print History
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    View and reprint past sessions
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View History
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Print Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Output Format:</span>
              <span className="font-medium">
                {printOutput === 'double-strip' ? '2 strips on 4x6' : 'Single strip'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paper Size:</span>
              <span className="font-medium">{paperSizeOptions.find(o => o.value === config.paperSize)?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quality:</span>
              <span className="font-medium capitalize">{config.quality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Copies per session:</span>
              <span className="font-medium">{config.copies}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto Print:</span>
              <span className="font-medium">{config.autoPrint ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cut Marks:</span>
              <span className="font-medium">{showCutMarks ? 'Enabled' : 'Disabled'}</span>
            </div>
            {colorCorrection.enabled && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Color Correction:</span>
                <span className="font-medium">Enabled</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
