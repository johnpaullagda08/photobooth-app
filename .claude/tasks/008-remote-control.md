# Task: Remote Control App

**Priority**: Low
**Category**: Feature
**Estimated Complexity**: Complex

## Description

Build a companion web app that allows event organizers to remotely control the photobooth from their phone.

## Requirements

1. **Connection**
   - WebSocket real-time connection
   - QR code pairing
   - PIN-based authentication
   - Auto-reconnect on disconnect

2. **Remote Controls**
   - Trigger capture manually
   - Pause/resume kiosk mode
   - Switch cameras
   - Adjust settings on-the-fly

3. **Live Monitoring**
   - Live camera preview (low-res)
   - Recent captures feed
   - Queue/print status
   - Error notifications

4. **Quick Actions**
   - Reset to launch screen
   - Clear current session
   - Force print
   - Switch events

## Files to Modify/Create

- `app/remote/page.tsx` - Remote control page
- `lib/remote/` - Remote control module
  - `websocket-server.ts`
  - `command-handlers.ts`
  - `pairing.ts`
- `components/remote/` - Remote components
  - `RemoteControls.tsx`
  - `LivePreview.tsx`
  - `StatusPanel.tsx`
  - `PairingDialog.tsx`
- `components/kiosk/KioskMode.tsx` - Add remote command handling

## Acceptance Criteria

- [ ] QR code pairing works reliably
- [ ] Remote capture triggers main booth
- [ ] Live preview shows current camera
- [ ] Settings changes apply immediately
- [ ] Works on mobile browsers

## Related Spec Sections

- Section 4.1: Core Components (KioskMode)
- Section 8: Camera System
