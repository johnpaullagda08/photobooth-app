# Task: AR/Face Filters

**Priority**: Medium
**Category**: Feature
**Estimated Complexity**: Complex

## Description

Implement augmented reality face filters using face detection and real-time overlay rendering for fun photo effects.

## Requirements

1. **Face Detection**
   - Use TensorFlow.js Face Landmarks Detection
   - Real-time detection at 30fps
   - Multi-face support (up to 4)

2. **Filter Types**
   - Hats/crowns
   - Glasses/sunglasses
   - Animal ears/noses
   - Makeup effects
   - Event-themed (wedding veil, party hat)

3. **Performance**
   - GPU acceleration via WebGL
   - Fallback to CPU if needed
   - Configurable quality settings

4. **User Experience**
   - Filter carousel in capture view
   - Preview before capture
   - Can be disabled per event

## Files to Modify/Create

- `lib/ar/` - AR filter module
  - `face-detection.ts`
  - `filter-renderer.ts`
  - `ar-effects.ts`
- `components/ar/` - AR components
  - `ARFilterSelector.tsx`
  - `ARPreview.tsx`
- `components/camera/CameraPreview.tsx` - Integrate AR layer
- `public/ar-assets/` - Filter images/models

## Dependencies

```json
{
  "@tensorflow/tfjs": "^4.x",
  "@tensorflow-models/face-landmarks-detection": "^1.x"
}
```

## Acceptance Criteria

- [ ] Face detection works in real-time
- [ ] At least 10 filters available
- [ ] Filters render correctly on detected faces
- [ ] Performance is acceptable on mid-range devices
- [ ] Can be toggled on/off per event

## Related Spec Sections

- Section 4.4: Camera Components
- Section 5.2: Kiosk Capture Flow
