# Printing System Documentation

## Overview

The photobooth uses a unified print layout system where ALL prints output to 4R (4x6) canvas at 300 DPI.

## Print Output Standards

### 4R Canvas (Universal Output)

```
Canvas: 1200 x 1800 px @ 300 DPI
Physical: 4 x 6 inches
Safe Margin: 20px on each side
```

**All prints use this canvas size**, regardless of the layout mode selected.

### Layout Modes

| Mode | Output | Description |
|------|--------|-------------|
| **Strip** (2x6) | 2 strips on 4R | Two identical 2x6 strips side-by-side |
| **4R** (4x6) | Single on 4R | Photo layout fills the 4R canvas |

### Strip Mode Specifications

When strip mode is selected, a **dynamic grid layout** is used:

```
Canvas: 1200 x 1800 px (4R)
Grid: 2 columns × N rows (based on photoCount)
Margins: 40px top/bottom, 40px left/right
Spacing: 20px horizontal, 20px vertical between boxes
```

**Grid Examples:**
- 3 photos → 2 cols × 2 rows (one empty)
- 4 photos → 2 cols × 2 rows
- 6 photos → 2 cols × 3 rows

**Layout Rules:**
- All photo boxes are equal size within the grid
- Background covers entire canvas (object-fit: cover)
- Photos maintain aspect ratio (object-fit: cover, centered)
- Preview exactly matches final print output

### 4R Mode Specifications

When 4R mode is selected:

```
Canvas: 1200 x 1800 px
Safe Area: 1160 x 1760 px
Layout: Photos positioned within safe area
```

## Print Methods

### 1. Browser Print (window.print)

**Use Case**: Any printer accessible via browser print dialog

**Implementation**:
```typescript
function browserPrint(imageDataUrl: string) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <style>
          @page { margin: 0; size: 4in 6in; }
          body { margin: 0; }
          img { width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <img src="${imageDataUrl}" onload="window.print();window.close();" />
      </body>
    </html>
  `);
}
```

### 2. WebUSB Direct Print

**Use Case**: Thermal dye-sub printers (DNP, HiTi, etc.)

**Supported Vendors**:
```typescript
const THERMAL_PRINTER_VENDORS = [
  { vendorId: 0x1343, name: 'DNP' },
  { vendorId: 0x0D16, name: 'HiTi' },
  { vendorId: 0x04F9, name: 'Brother' },
];
```

## Using the Print Composer

### Basic Usage

```typescript
import { composeForPrint, getPrintBlob } from '@/lib/printing';

// For strip mode (dynamic grid layout on 4R)
const canvas = await composeForPrint({
  photos: capturedPhotos,
  photoCount: 4,           // 4 photos → 2×2 grid
  filterId: 'vintage',
  theme: selectedTheme,
  printSize: '2x6',        // Strip mode
  backgroundImage: bgImage,
  frameTemplate: frameOverlay,
});

// For 4R mode
const canvas = await composeForPrint({
  photos: capturedPhotos,
  photoCount: 4,
  filterId: 'none',
  theme: selectedTheme,
  printSize: '4x6',  // 4R mode
  boxes: layoutBoxes,
  backgroundImage: bgImage,
  frameTemplate: frameOverlay,
});

// Export as blob for printing
const blob = await getPrintBlob(options, 'jpeg', 0.95);
```

### Custom Box Layout

Photo positions use percentages (0-100):

```typescript
interface BoxConfig {
  id: string;
  label: string;
  x: number;      // Left edge (0-100%)
  y: number;      // Top edge (0-100%)
  width: number;  // Box width (0-100%)
  height: number; // Box height (0-100%)
}

// Example: 4-photo strip layout
const stripBoxes = [
  { id: '1', label: 'Photo 1', x: 5, y: 5, width: 90, height: 22 },
  { id: '2', label: 'Photo 2', x: 5, y: 29, width: 90, height: 22 },
  { id: '3', label: 'Photo 3', x: 5, y: 53, width: 90, height: 22 },
  { id: '4', label: 'Photo 4', x: 5, y: 77, width: 90, height: 22 },
];
```

## Print Preview

### Using PrintRenderer

```tsx
import { PrintRenderer } from '@/components/layout-editor';

// Editor preview (shows dynamic grid layout for strip mode)
<PrintRenderer
  boxes={layoutBoxes}
  paperSize="strip"
  photoCount={4}           // Dynamic grid: 2×2 for 4 photos
  backgroundColor="#ffffff"
  backgroundImage={bgImage}
  frameTemplate={frameOverlay}
  photos={capturedPhotos}
  showPlaceholders={true}
/>

// Print preview (shows actual print output - exact match)
<PrintRenderer
  boxes={layoutBoxes}
  paperSize="strip"
  photoCount={4}           // Dynamic grid: 2×2 for 4 photos
  photos={capturedPhotos}
  showPrintPreview={true}  // Same layout as final print
/>
```

### Preview vs Print

| Mode | Editor Preview | Print Preview | Final Output |
|------|---------------|---------------|--------------|
| Strip | Dynamic grid (2×N) | Dynamic grid (2×N) | Dynamic grid (2×N) on 4R |
| 4R | 6x4 layout | 4R with margins | 4R with margins |

**Note**: Strip mode preview exactly matches print output (same grid layout).

## Image Scaling Rules

### Cover Fit (Photos)

Photos are scaled to fill their box, cropping if necessary:

```typescript
function calculateCoverCrop(srcWidth, srcHeight, targetWidth, targetHeight) {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  if (srcRatio > targetRatio) {
    // Source wider - crop width
    const sw = srcHeight * targetRatio;
    const sx = (srcWidth - sw) / 2;
    return { sx, sy: 0, sw, sh: srcHeight };
  } else {
    // Source taller - crop height
    const sh = srcWidth / targetRatio;
    const sy = (srcHeight - sh) / 2;
    return { sx: 0, sy, sw: srcWidth, sh };
  }
}
```

### Contain Fit (Backgrounds)

Background images are scaled to fit without cropping:

```typescript
function calculateContainFit(srcWidth, srcHeight, targetWidth, targetHeight) {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  if (srcRatio > targetRatio) {
    const width = targetWidth;
    const height = targetWidth / srcRatio;
    return { x: 0, y: (targetHeight - height) / 2, width, height };
  } else {
    const height = targetHeight;
    const width = targetHeight * srcRatio;
    return { x: (targetWidth - width) / 2, y: 0, width, height };
  }
}
```

## Validation

### Box Validation

```typescript
import { validateBoxes } from '@/lib/printing';

const { valid, errors } = validateBoxes(boxes);

if (!valid) {
  console.error('Layout errors:', errors);
  // Example errors:
  // - "Photo 1: X position out of bounds"
  // - "Photo 2: Exceeds right edge"
}
```

## Print Specifications Summary

| Property | Value |
|----------|-------|
| Canvas Size | 1200 x 1800 px |
| DPI | 300 |
| Physical Size | 4 x 6 inches |
| Grid Columns | 2 (strip mode) |
| Grid Margins | 40px top/bottom/left/right |
| Grid Spacing | 20px horizontal, 20px vertical |
| Export Format | JPEG 95% quality |

## Troubleshooting

### Print Quality Issues

1. **Verify DPI**: Output should be 300 DPI
2. **Check export quality**: Use 0.95 for JPEG
3. **Inspect safe margins**: Ensure content is within safe area
4. **Test with browser print**: Compare WebUSB vs browser output

### Layout Mismatch

1. **Enable showPrintPreview**: Verify preview matches intent
2. **Check box positions**: Ensure percentages are within 0-100
3. **Validate layout**: Use `validateBoxes()` before printing

### WebUSB Errors

- **SecurityError**: Requires HTTPS
- **NotFoundError**: No matching printer
- **NotAllowedError**: User denied permission
