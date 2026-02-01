'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout,
  Save,
  Download,
  Upload,
  Trash2,
  Grid2X2,
  LayoutGrid,
  Square,
  Rows3,
  Check,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BoxConfig, PaperSize, PrintLayoutConfig } from '@/lib/events/types';

export interface LayoutTemplate {
  id: string;
  name: string;
  paperSize: PaperSize;
  boxes: BoxConfig[];
  backgroundImage: string | null;
  frameTemplate: string | null;
  backgroundColor: string;
  createdAt: number;
  isBuiltIn: boolean;
}

interface TemplatePanelProps {
  currentBoxes: BoxConfig[];
  paperSize: PaperSize;
  currentBackgroundImage?: string | null;
  currentFrameTemplate?: string | null;
  currentBackgroundColor?: string;
  onApplyTemplate: (template: LayoutTemplate) => void;
}

const STORAGE_KEY = 'photobooth_layout_templates';

// Built-in templates
const createBuiltInTemplates = (paperSize: PaperSize): LayoutTemplate[] => {
  if (paperSize === 'strip') {
    return [
      {
        id: 'builtin-strip-4',
        name: '4 Photos',
        paperSize: 'strip',
        boxes: [
          { id: 'photo-1', label: 'Photo 1', x: 5, y: 3, width: 90, height: 22 },
          { id: 'photo-2', label: 'Photo 2', x: 5, y: 27, width: 90, height: 22 },
          { id: 'photo-3', label: 'Photo 3', x: 5, y: 51, width: 90, height: 22 },
          { id: 'photo-4', label: 'Photo 4', x: 5, y: 75, width: 90, height: 22 },
        ],
        backgroundImage: null,
        frameTemplate: null,
        backgroundColor: '#ffffff',
        createdAt: 0,
        isBuiltIn: true,
      },
      {
        id: 'builtin-strip-3',
        name: '3 Photos',
        paperSize: 'strip',
        boxes: [
          { id: 'photo-1', label: 'Photo 1', x: 5, y: 5, width: 90, height: 28 },
          { id: 'photo-2', label: 'Photo 2', x: 5, y: 36, width: 90, height: 28 },
          { id: 'photo-3', label: 'Photo 3', x: 5, y: 67, width: 90, height: 28 },
        ],
        backgroundImage: null,
        frameTemplate: null,
        backgroundColor: '#ffffff',
        createdAt: 0,
        isBuiltIn: true,
      },
      {
        id: 'builtin-strip-2',
        name: '2 Photos',
        paperSize: 'strip',
        boxes: [
          { id: 'photo-1', label: 'Photo 1', x: 5, y: 5, width: 90, height: 43 },
          { id: 'photo-2', label: 'Photo 2', x: 5, y: 52, width: 90, height: 43 },
        ],
        backgroundImage: null,
        frameTemplate: null,
        backgroundColor: '#ffffff',
        createdAt: 0,
        isBuiltIn: true,
      },
    ];
  }

  // 4R templates (landscape)
  return [
    {
      id: 'builtin-4r-grid',
      name: '2×2 Grid',
      paperSize: '4r',
      boxes: [
        { id: 'photo-1', label: 'Photo 1', x: 3, y: 3, width: 46, height: 45 },
        { id: 'photo-2', label: 'Photo 2', x: 51, y: 3, width: 46, height: 45 },
        { id: 'photo-3', label: 'Photo 3', x: 3, y: 52, width: 46, height: 45 },
        { id: 'photo-4', label: 'Photo 4', x: 51, y: 52, width: 46, height: 45 },
      ],
      backgroundImage: null,
      frameTemplate: null,
      backgroundColor: '#ffffff',
      createdAt: 0,
      isBuiltIn: true,
    },
    {
      id: 'builtin-4r-single',
      name: 'Single Photo',
      paperSize: '4r',
      boxes: [
        { id: 'photo-1', label: 'Photo 1', x: 5, y: 5, width: 90, height: 90 },
      ],
      backgroundImage: null,
      frameTemplate: null,
      backgroundColor: '#ffffff',
      createdAt: 0,
      isBuiltIn: true,
    },
    {
      id: 'builtin-4r-2col',
      name: '2 Column',
      paperSize: '4r',
      boxes: [
        { id: 'photo-1', label: 'Photo 1', x: 3, y: 5, width: 46, height: 90 },
        { id: 'photo-2', label: 'Photo 2', x: 51, y: 5, width: 46, height: 90 },
      ],
      backgroundImage: null,
      frameTemplate: null,
      backgroundColor: '#ffffff',
      createdAt: 0,
      isBuiltIn: true,
    },
    {
      id: 'builtin-4r-3col',
      name: '3 Column',
      paperSize: '4r',
      boxes: [
        { id: 'photo-1', label: 'Photo 1', x: 2, y: 10, width: 31, height: 80 },
        { id: 'photo-2', label: 'Photo 2', x: 35, y: 10, width: 31, height: 80 },
        { id: 'photo-3', label: 'Photo 3', x: 68, y: 10, width: 30, height: 80 },
      ],
      backgroundImage: null,
      frameTemplate: null,
      backgroundColor: '#ffffff',
      createdAt: 0,
      isBuiltIn: true,
    },
  ];
};

// Template icon based on box count
function getTemplateIcon(boxCount: number) {
  switch (boxCount) {
    case 1:
      return Square;
    case 2:
      return Rows3;
    case 3:
      return LayoutGrid;
    default:
      return Grid2X2;
  }
}

export function TemplatePanel({
  currentBoxes,
  paperSize,
  currentBackgroundImage,
  currentFrameTemplate,
  currentBackgroundColor = '#ffffff',
  onApplyTemplate,
}: TemplatePanelProps) {
  const [userTemplates, setUserTemplates] = useState<LayoutTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Built-in templates for current paper size
  const builtInTemplates = createBuiltInTemplates(paperSize);

  // Load user templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const templates: LayoutTemplate[] = JSON.parse(stored);
        setUserTemplates(templates.filter((t) => t.paperSize === paperSize));
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }, [paperSize]);

  // Save user templates to localStorage
  const saveUserTemplates = useCallback((templates: LayoutTemplate[]) => {
    try {
      // Get all templates (including other paper sizes)
      const stored = localStorage.getItem(STORAGE_KEY);
      const allTemplates: LayoutTemplate[] = stored ? JSON.parse(stored) : [];

      // Replace templates for current paper size
      const otherTemplates = allTemplates.filter((t) => t.paperSize !== paperSize);
      const newAllTemplates = [...otherTemplates, ...templates];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAllTemplates));
      setUserTemplates(templates);
    } catch (err) {
      console.error('Failed to save templates:', err);
    }
  }, [paperSize]);

  // Handle save current layout
  const handleSaveTemplate = useCallback(() => {
    if (!newTemplateName.trim() || currentBoxes.length === 0) return;

    const newTemplate: LayoutTemplate = {
      id: `user-${Date.now()}`,
      name: newTemplateName.trim(),
      paperSize,
      boxes: currentBoxes.map((box) => ({ ...box })),
      backgroundImage: currentBackgroundImage || null,
      frameTemplate: currentFrameTemplate || null,
      backgroundColor: currentBackgroundColor,
      createdAt: Date.now(),
      isBuiltIn: false,
    };

    saveUserTemplates([...userTemplates, newTemplate]);
    setNewTemplateName('');
    setShowSaveDialog(false);
  }, [newTemplateName, currentBoxes, paperSize, currentBackgroundImage, currentFrameTemplate, currentBackgroundColor, userTemplates, saveUserTemplates]);

  // Handle delete user template
  const handleDeleteTemplate = useCallback(
    (templateId: string) => {
      const filtered = userTemplates.filter((t) => t.id !== templateId);
      saveUserTemplates(filtered);
    },
    [userTemplates, saveUserTemplates]
  );

  // Handle apply template
  const handleApplyTemplate = useCallback(
    (template: LayoutTemplate) => {
      setSelectedTemplateId(template.id);
      // Pass the full template with deep-copied boxes
      onApplyTemplate({
        ...template,
        boxes: template.boxes.map((box) => ({ ...box })),
      });

      // Clear selection after a delay for visual feedback
      setTimeout(() => setSelectedTemplateId(null), 500);
    },
    [onApplyTemplate]
  );

  // Handle export template
  const handleExportTemplate = useCallback((template: LayoutTemplate) => {
    const exportData = {
      ...template,
      exportedAt: Date.now(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layout-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Handle export all user templates
  const handleExportAll = useCallback(() => {
    if (userTemplates.length === 0) return;

    const exportData = {
      templates: userTemplates,
      exportedAt: Date.now(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layouts-${paperSize}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [userTemplates, paperSize]);

  // Handle import template
  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);

          // Check if it's a single template or multiple
          if (data.templates && Array.isArray(data.templates)) {
            // Multiple templates
            const validTemplates = data.templates.filter(
              (t: LayoutTemplate) =>
                t.paperSize === paperSize &&
                t.boxes &&
                Array.isArray(t.boxes)
            );

            if (validTemplates.length > 0) {
              const imported = validTemplates.map((t: LayoutTemplate) => ({
                ...t,
                id: `imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                isBuiltIn: false,
                // Ensure new fields have defaults for backwards compatibility
                backgroundImage: t.backgroundImage ?? null,
                frameTemplate: t.frameTemplate ?? null,
                backgroundColor: t.backgroundColor ?? '#ffffff',
              }));
              saveUserTemplates([...userTemplates, ...imported]);
            }
          } else if (data.boxes && Array.isArray(data.boxes)) {
            // Single template
            if (data.paperSize === paperSize) {
              const imported: LayoutTemplate = {
                ...data,
                id: `imported-${Date.now()}`,
                isBuiltIn: false,
                // Ensure new fields have defaults for backwards compatibility
                backgroundImage: data.backgroundImage ?? null,
                frameTemplate: data.frameTemplate ?? null,
                backgroundColor: data.backgroundColor ?? '#ffffff',
              };
              saveUserTemplates([...userTemplates, imported]);
            }
          }
        } catch (err) {
          console.error('Failed to import template:', err);
        }
      };
      reader.readAsText(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [paperSize, userTemplates, saveUserTemplates]
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Templates
          </CardTitle>
          <div className="flex gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              title="Import template"
            >
              <Upload className="w-4 h-4" />
            </Button>
            {userTemplates.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleExportAll}
                title="Export all templates"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          {paperSize === 'strip' ? 'Strip layouts' : '4R layouts'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          <div className="space-y-4">
            {/* Built-in Templates */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Built-in
              </Label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {builtInTemplates.map((template) => (
                  <TemplateItem
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    onApply={() => handleApplyTemplate(template)}
                  />
                ))}
              </div>
            </div>

            {/* User Templates */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                My Templates
              </Label>
              <div className="mt-2 space-y-2">
                {userTemplates.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No saved templates yet
                  </p>
                ) : (
                  userTemplates.map((template) => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplateId === template.id}
                      onApply={() => handleApplyTemplate(template)}
                      onDelete={() => handleDeleteTemplate(template.id)}
                      onExport={() => handleExportTemplate(template)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>

      {/* Save Button */}
      <div className="p-4 border-t">
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setShowSaveDialog(true)}
          disabled={currentBoxes.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Current Layout
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Layout Template</DialogTitle>
            <DialogDescription>
              Save your current layout for reuse across events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., My Custom Layout"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="text-sm text-muted-foreground">
              This template contains {currentBoxes.length} photo box
              {currentBoxes.length !== 1 ? 'es' : ''}.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!newTemplateName.trim()}
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Template Item Component
interface TemplateItemProps {
  template: LayoutTemplate;
  isSelected: boolean;
  onApply: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

function TemplateItem({
  template,
  isSelected,
  onApply,
  onDelete,
  onExport,
}: TemplateItemProps) {
  const Icon = getTemplateIcon(template.boxes.length);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50'
      )}
      onClick={onApply}
    >
      <div
        className={cn(
          'p-2 rounded-md',
          template.isBuiltIn ? 'bg-blue-500/10' : 'bg-green-500/10'
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4',
            template.isBuiltIn ? 'text-blue-500' : 'text-green-500'
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{template.name}</p>
        <p className="text-xs text-muted-foreground">
          {template.boxes.length} photo{template.boxes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}

      {!template.isBuiltIn && (onDelete || onExport) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onExport && (
              <DropdownMenuItem onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.div>
  );
}
