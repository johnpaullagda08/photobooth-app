# Task: GIF & Video Capture Mode

**Priority**: Medium
**Category**: Feature
**Estimated Complexity**: Complex

## Description

Add the ability to capture animated GIFs and short video clips in addition to still photos.

## Requirements

1. **GIF Mode**
   - Capture burst of 3-8 frames
   - Adjustable frame delay (100-500ms)
   - Boomerang effect option
   - Apply filters to GIF

2. **Video Mode**
   - Record 3-10 second clips
   - Real-time filter preview
   - Audio capture option
   - Trim/edit before saving

3. **Output Formats**
   - GIF (web-optimized)
   - MP4 (H.264)
   - WebM (VP9)
   - Configurable quality

4. **Integration**
   - Works with existing kiosk flow
   - Mode selector in capture settings
   - GIF/video preview in result screen
   - Download and share support

## Files to Modify/Create

- `lib/media/` - Media capture module
  - `gif-encoder.ts`
  - `video-recorder.ts`
  - `media-processing.ts`
- `components/capture/` - Capture components
  - `GifCaptureMode.tsx`
  - `VideoCaptureMode.tsx`
  - `MediaModeSelector.tsx`
- `components/preview/` - Preview components
  - `GifPreview.tsx`
  - `VideoPreview.tsx`
- `hooks/useMediaCapture.ts` - Media capture hook

## Dependencies

```json
{
  "gif.js": "^0.2.x",
  "@ffmpeg/ffmpeg": "^0.12.x"
}
```

## Acceptance Criteria

- [ ] GIF captures work smoothly
- [ ] Video recording with audio
- [ ] Filters apply to GIF/video
- [ ] Output files are web-optimized
- [ ] Download works for all formats

## Related Spec Sections

- Section 4.4: Camera Components
- Section 5.2: Kiosk Capture Flow
