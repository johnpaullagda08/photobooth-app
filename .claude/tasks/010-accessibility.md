# Task: Accessibility Improvements

**Priority**: High
**Category**: Enhancement
**Estimated Complexity**: Medium

## Description

Enhance accessibility to ensure the photobooth is usable by people with disabilities, meeting WCAG 2.1 AA standards.

## Requirements

1. **Screen Reader Support**
   - Proper ARIA labels
   - Semantic HTML structure
   - Live regions for dynamic content
   - Focus management

2. **Keyboard Navigation**
   - Full keyboard operability
   - Visible focus indicators
   - Skip links
   - Logical tab order

3. **Visual Accessibility**
   - Sufficient color contrast (4.5:1)
   - Resize-friendly text
   - High contrast mode
   - Reduced motion option

4. **Kiosk Mode A11y**
   - Voice instructions option
   - Large touch targets (44x44px min)
   - Audio feedback for captures
   - Alternative input support

## Files to Modify/Create

- `components/ui/` - Enhance all UI components
- `components/kiosk/` - Kiosk accessibility
  - Add ARIA roles
  - Add keyboard handlers
  - Add audio feedback
- `lib/accessibility/` - A11y utilities
  - `announcer.ts` - Screen reader announcements
  - `focus-trap.ts` - Focus management
- `styles/` - High contrast theme

## Testing Tools

- axe-core for automated testing
- VoiceOver/NVDA manual testing
- Keyboard-only navigation testing

## Acceptance Criteria

- [ ] Passes axe-core audit with no critical issues
- [ ] Fully keyboard navigable
- [ ] Screen reader announces all actions
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion respects OS setting

## Related Spec Sections

- Section 10: Styling
- Section 4: Components
