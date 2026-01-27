import type { Overlay } from '@/types';
import { OVERLAYS } from '@/constants/config';
import { formatDateTime } from '@/lib/utils';

// Re-export overlay definitions
export { OVERLAYS };

// Helper to get overlay by ID
export function getOverlay(id: string): Overlay | undefined {
  return OVERLAYS.find((o) => o.id === id);
}

// Generate text content for datetime overlay
export function getDateTimeOverlayText(): string {
  return formatDateTime(new Date());
}

// Render text overlay to canvas
export function renderTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: Overlay,
  canvasWidth: number,
  canvasHeight: number,
  customText?: string
): void {
  if (overlay.type !== 'text' && overlay.type !== 'datetime') return;

  const text = overlay.type === 'datetime'
    ? getDateTimeOverlayText()
    : customText || overlay.text || '';

  if (!text) return;

  ctx.save();

  // Apply styles
  const style = overlay.style || {};
  ctx.fillStyle = style.color || '#333333';
  ctx.font = `${style.fontSize || '14px'} ${style.fontFamily || 'Arial, sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Calculate position
  let x = canvasWidth / 2;
  let y: number;

  switch (overlay.position) {
    case 'top':
      y = 30;
      break;
    case 'center':
      y = canvasHeight / 2;
      break;
    case 'bottom':
    default:
      y = canvasHeight - 30;
      break;
  }

  // Draw text with shadow for better visibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.fillText(text, x, y);

  ctx.restore();
}

// Load and render frame overlay to canvas
export async function renderFrameOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: Overlay,
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  if (overlay.type !== 'frame' || !overlay.src) return;

  const src = overlay.src;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      resolve();
    };

    img.onerror = () => {
      console.error(`Failed to load frame overlay: ${src}`);
      resolve();
    };

    img.src = src;
  });
}

// Render logo overlay to canvas
export async function renderLogoOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: Overlay,
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  if (overlay.type !== 'logo' || !overlay.src) return;

  const src = overlay.src;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Scale logo to reasonable size (max 20% of canvas width)
      const maxWidth = canvasWidth * 0.2;
      const scale = Math.min(1, maxWidth / img.width);
      const width = img.width * scale;
      const height = img.height * scale;

      // Position based on overlay settings
      let x: number;
      let y: number;

      switch (overlay.position) {
        case 'top':
          x = (canvasWidth - width) / 2;
          y = 20;
          break;
        case 'center':
          x = (canvasWidth - width) / 2;
          y = (canvasHeight - height) / 2;
          break;
        case 'bottom':
        default:
          x = (canvasWidth - width) / 2;
          y = canvasHeight - height - 20;
          break;
      }

      ctx.drawImage(img, x, y, width, height);
      resolve();
    };

    img.onerror = () => {
      console.error(`Failed to load logo overlay: ${src}`);
      resolve();
    };

    img.src = src;
  });
}

// Render all overlays to canvas
export async function renderOverlays(
  ctx: CanvasRenderingContext2D,
  overlayIds: string[],
  canvasWidth: number,
  canvasHeight: number,
  customTexts?: Record<string, string>
): Promise<void> {
  for (const id of overlayIds) {
    const overlay = getOverlay(id);
    if (!overlay) continue;

    switch (overlay.type) {
      case 'frame':
        await renderFrameOverlay(ctx, overlay, canvasWidth, canvasHeight);
        break;
      case 'logo':
        await renderLogoOverlay(ctx, overlay, canvasWidth, canvasHeight);
        break;
      case 'text':
      case 'datetime':
        renderTextOverlay(ctx, overlay, canvasWidth, canvasHeight, customTexts?.[id]);
        break;
    }
  }
}
