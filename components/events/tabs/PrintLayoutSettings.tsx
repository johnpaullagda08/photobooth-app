'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Layout, Trash2, Info, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LayoutCanvas, TemplatePanel, BoxPropertiesPanel, type LayoutTemplate } from '@/components/layout-editor';
import type { PrintLayoutConfig, BoxConfig, PaperSize } from '@/lib/events/types';

// Storage key for user templates (must match TemplatePanel)
const TEMPLATE_STORAGE_KEY = 'photobooth_layout_templates';

interface PrintLayoutSettingsProps {
  config: PrintLayoutConfig;
  onUpdate: (config: PrintLayoutConfig) => void;
  paperSize: PaperSize;
}

export function PrintLayoutSettings({ config, onUpdate, paperSize }: PrintLayoutSettingsProps) {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);

  // Handle active template change
  const handleActiveTemplateChange = useCallback((templateId: string | null, templateName: string | null) => {
    setActiveTemplateId(templateId);
    setActiveTemplateName(templateName);
  }, []);

  // Auto-save background/frame changes to user templates
  // Only saves to user templates (those starting with 'user-' or 'imported-')
  const autoSaveToUserTemplate = useCallback((updates: Partial<LayoutTemplate>) => {
    if (!activeTemplateId) return;

    // Only auto-save to user templates, not built-in templates
    const isUserTemplate = activeTemplateId.startsWith('user-') || activeTemplateId.startsWith('imported-');
    if (!isUserTemplate) return;

    try {
      const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!stored) return;

      const templates: LayoutTemplate[] = JSON.parse(stored);
      const updatedTemplates = templates.map((t) =>
        t.id === activeTemplateId ? { ...t, ...updates } : t
      );

      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updatedTemplates));
    } catch (err) {
      console.error('Failed to auto-save template:', err);
    }
  }, [activeTemplateId]);

  // Get selected box
  const selectedBox = config.boxes.find((b) => b.id === selectedBoxId) || null;

  // Handle box update
  const handleBoxUpdate = useCallback(
    (boxId: string, updates: Partial<BoxConfig>) => {
      const updatedBoxes = config.boxes.map((box) =>
        box.id === boxId ? { ...box, ...updates } : box
      );
      onUpdate({ ...config, boxes: updatedBoxes });
    },
    [config, onUpdate]
  );

  // Handle add box
  const handleAddBox = useCallback(() => {
    if (config.boxes.length >= 4) return;

    const newBox: BoxConfig = {
      id: `photo-${config.boxes.length + 1}-${Date.now()}`,
      label: `Photo ${config.boxes.length + 1}`,
      x: 10,
      y: 10,
      width: 35,
      height: 35,
    };

    onUpdate({ ...config, boxes: [...config.boxes, newBox] });
    setSelectedBoxId(newBox.id);
  }, [config, onUpdate]);

  // Handle delete box
  const handleDeleteBox = useCallback(
    (boxId: string) => {
      const updatedBoxes = config.boxes.filter((box) => box.id !== boxId);
      onUpdate({ ...config, boxes: updatedBoxes });

      if (selectedBoxId === boxId) {
        setSelectedBoxId(null);
      }
    },
    [config, onUpdate, selectedBoxId]
  );

  // Handle apply template - applies template's EXACT settings (no inheritance)
  // Each template maintains its own independent background
  const handleApplyTemplate = useCallback(
    (template: LayoutTemplate) => {
      // Generate new IDs to avoid conflicts
      const newBoxes = template.boxes.map((box, index) => ({
        ...box,
        id: `photo-${index + 1}-${Date.now()}`,
      }));

      // ALWAYS apply the template's exact background settings
      // This ensures each template maintains its own independent state
      // Built-in templates with null background will show no background (white)
      onUpdate({
        ...config,
        boxes: newBoxes,
        backgroundImage: template.backgroundImage,  // Apply exactly (even if null)
        frameTemplate: template.frameTemplate,      // Apply exactly (even if null)
        backgroundColor: template.backgroundColor || '#ffffff',
        // Update photoCount to match the number of boxes
        photoCount: Math.min(4, Math.max(1, newBoxes.length)) as 1 | 3 | 4,
      });
      setSelectedBoxId(null);
    },
    [config, onUpdate]
  );

  // Handle frame upload - auto-saves to user templates
  const handleFrameUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const frameTemplate = reader.result as string;
          // Update event config
          onUpdate({ ...config, frameTemplate });
          // Auto-save to user template if active
          autoSaveToUserTemplate({ frameTemplate });
        };
        reader.readAsDataURL(file);
      }
    },
    [config, onUpdate, autoSaveToUserTemplate]
  );

  // Handle background image upload - auto-saves to user templates
  const handleBackgroundImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const backgroundImage = reader.result as string;
          // Update event config
          onUpdate({ ...config, backgroundImage });
          // Auto-save to user template if active
          autoSaveToUserTemplate({ backgroundImage });
        };
        reader.readAsDataURL(file);
      }
    },
    [config, onUpdate, autoSaveToUserTemplate]
  );

  // Handle removing background image - auto-saves to user templates
  const handleRemoveBackground = useCallback(() => {
    onUpdate({ ...config, backgroundImage: null });
    autoSaveToUserTemplate({ backgroundImage: null });
  }, [config, onUpdate, autoSaveToUserTemplate]);

  // Handle removing frame overlay - auto-saves to user templates
  const handleRemoveFrame = useCallback(() => {
    onUpdate({ ...config, frameTemplate: null });
    autoSaveToUserTemplate({ frameTemplate: null });
  }, [config, onUpdate, autoSaveToUserTemplate]);

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* Left Panel - Templates (Desktop) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-0">
            <TemplatePanel
              currentBoxes={config.boxes}
              paperSize={paperSize}
              currentBackgroundImage={config.backgroundImage}
              currentFrameTemplate={config.frameTemplate}
              currentBackgroundColor={config.backgroundColor}
              onApplyTemplate={handleApplyTemplate}
              activeTemplateId={activeTemplateId}
              onActiveTemplateChange={handleActiveTemplateChange}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-6 space-y-6">
          {/* Paper Size Info & Active Template */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  <CardTitle className="text-base">Layout Editor</CardTitle>
                </div>
                {activeTemplateName && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Pencil className="w-3 h-3 mr-1" />
                    Editing: {activeTemplateName}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Drag, resize, and arrange photo boxes on the canvas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">
                    {paperSize === 'strip' ? 'Strip (Portrait)' : '4R (Landscape)'}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {paperSize === 'strip' ? '2×6 inch photo strip' : '4×6 inch landscape'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout Canvas */}
          <Card>
            <CardContent className="pt-6">
              <LayoutCanvas
                boxes={config.boxes}
                paperSize={paperSize}
                selectedBoxId={selectedBoxId}
                onSelectBox={setSelectedBoxId}
                onUpdateBox={handleBoxUpdate}
                onDeleteBox={handleDeleteBox}
                onAddBox={handleAddBox}
                maxBoxes={4}
                frameTemplate={config.frameTemplate}
                backgroundImage={config.backgroundImage}
                backgroundColor={config.backgroundColor || '#ffffff'}
              />
            </CardContent>
          </Card>

          {/* Mobile Templates */}
          <div className="lg:hidden">
            <TemplatePanel
              currentBoxes={config.boxes}
              paperSize={paperSize}
              currentBackgroundImage={config.backgroundImage}
              currentFrameTemplate={config.frameTemplate}
              currentBackgroundColor={config.backgroundColor}
              onApplyTemplate={handleApplyTemplate}
              activeTemplateId={activeTemplateId}
              onActiveTemplateChange={handleActiveTemplateChange}
            />
          </div>

          {/* Background Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Background Image</CardTitle>
              <CardDescription>
                Optional background image (renders behind photos)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundImageUpload}
                  className="flex-1"
                />
                {config.backgroundImage && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveBackground}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {config.backgroundImage && (
                <div className="h-24 rounded-lg overflow-hidden bg-muted border">
                  <img
                    src={config.backgroundImage}
                    alt="Background"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Frame Template */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Frame Overlay</CardTitle>
              <CardDescription>
                Optional frame overlay (renders above photos)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFrameUpload}
                  className="flex-1"
                />
                {config.frameTemplate && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveFrame}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {config.frameTemplate && (
                <div className="h-24 rounded-lg overflow-hidden bg-muted border">
                  <img
                    src={config.frameTemplate}
                    alt="Frame template"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Margins & Spacing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Print Settings</CardTitle>
              <CardDescription>
                Fine-tune margins and spacing for printing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Top Margin</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {config.margins.top}%
                    </span>
                  </div>
                  <Slider
                    value={[config.margins.top]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([value]) =>
                      onUpdate({
                        ...config,
                        margins: { ...config.margins, top: value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Bottom Margin</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {config.margins.bottom}%
                    </span>
                  </div>
                  <Slider
                    value={[config.margins.bottom]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([value]) =>
                      onUpdate({
                        ...config,
                        margins: { ...config.margins, bottom: value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Left Margin</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {config.margins.left}%
                    </span>
                  </div>
                  <Slider
                    value={[config.margins.left]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([value]) =>
                      onUpdate({
                        ...config,
                        margins: { ...config.margins, left: value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Right Margin</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {config.margins.right}%
                    </span>
                  </div>
                  <Slider
                    value={[config.margins.right]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([value]) =>
                      onUpdate({
                        ...config,
                        margins: { ...config.margins, right: value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Photo Spacing</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {config.spacing}%
                    </span>
                  </div>
                  <Slider
                    value={[config.spacing]}
                    min={0}
                    max={15}
                    step={1}
                    onValueChange={([value]) =>
                      onUpdate({ ...config, spacing: value })
                    }
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-sm">Background Color</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Input
                        type="color"
                        value={config.backgroundColor || '#ffffff'}
                        onChange={(e) =>
                          onUpdate({ ...config, backgroundColor: e.target.value })
                        }
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                    </div>
                    <Input
                      type="text"
                      value={config.backgroundColor || '#ffffff'}
                      onChange={(e) => {
                        const color = e.target.value;
                        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                          onUpdate({ ...config, backgroundColor: color });
                        }
                      }}
                      placeholder="#ffffff"
                      className="w-28 h-10 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdate({ ...config, backgroundColor: '#ffffff' })}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Box Properties */}
        <div className="lg:col-span-3">
          <div className="sticky top-0">
            <BoxPropertiesPanel
              box={selectedBox}
              onUpdate={(updates) => {
                if (selectedBoxId) {
                  handleBoxUpdate(selectedBoxId, updates);
                }
              }}
              onDelete={() => {
                if (selectedBoxId) {
                  handleDeleteBox(selectedBoxId);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
