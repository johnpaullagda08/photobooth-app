# Task: Event Gallery Mode

**Priority**: High
**Category**: Feature
**Estimated Complexity**: Medium

## Description

Create a gallery view for event organizers and guests to browse all captured photos from an event in a beautiful grid layout.

## Requirements

1. **Gallery View**
   - Masonry/grid layout
   - Lightbox for full-size viewing
   - Lazy loading for performance
   - Infinite scroll or pagination

2. **Photo Management**
   - Mark favorites
   - Delete unwanted photos
   - Bulk download
   - Print multiple

3. **Guest Access**
   - Shareable gallery link
   - Optional password protection
   - QR code for gallery URL

4. **Slideshow Mode**
   - Auto-advancing slideshow
   - Fullscreen display
   - Background music option
   - Random or chronological order

## Files to Modify/Create

- `app/gallery/[eventId]/page.tsx` - Gallery page
- `components/gallery/` - Gallery components
  - `PhotoGrid.tsx`
  - `Lightbox.tsx`
  - `GalleryControls.tsx`
  - `SlideshowMode.tsx`
- `lib/gallery/` - Gallery utilities
  - `photo-storage.ts`
  - `gallery-links.ts`

## Acceptance Criteria

- [ ] Gallery displays all event photos
- [ ] Lightbox shows full-size images
- [ ] Bulk actions work correctly
- [ ] Shareable links function
- [ ] Slideshow auto-advances smoothly

## Related Spec Sections

- Section 5.2: Kiosk Capture Flow
- Section 7: State Management
