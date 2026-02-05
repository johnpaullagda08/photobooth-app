# Task: Social Media Sharing

**Priority**: Medium
**Category**: Feature
**Estimated Complexity**: Medium

## Description

Add direct social media sharing capabilities to allow guests to instantly share their photo strips to popular platforms.

## Requirements

1. **Sharing Platforms**
   - Facebook (via Share API)
   - Instagram (via deep link)
   - Twitter/X
   - Copy link to clipboard
   - Email sharing

2. **Shareable Content**
   - Photo strip image
   - Event hashtag
   - Custom caption template
   - Link back to event page

3. **QR Code Enhancement**
   - QR code links to download page
   - Optional direct-to-social QR

4. **Privacy Considerations**
   - Consent checkbox before sharing
   - Option to blur/hide faces
   - Watermark toggle

## Files to Modify/Create

- `components/sharing/` - New sharing components
  - `ShareButtons.tsx`
  - `ShareModal.tsx`
  - `SocialPreview.tsx`
- `lib/sharing/` - Sharing utilities
  - `social-apis.ts`
  - `link-generator.ts`
- `components/kiosk/ResultScreen.tsx` - Add share buttons

## Acceptance Criteria

- [ ] Share buttons appear on result screen
- [ ] Facebook share opens correct dialog
- [ ] Instagram opens app with image
- [ ] Copy link works reliably
- [ ] QR code links to download page

## Related Spec Sections

- Section 5.2: Kiosk Capture Flow
- Section 5.3: Print Flow
