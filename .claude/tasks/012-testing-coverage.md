# Task: Comprehensive Test Coverage

**Priority**: High
**Category**: Quality
**Estimated Complexity**: Medium

## Description

Expand test coverage with unit tests, integration tests, and enhanced E2E tests to ensure reliability.

## Requirements

1. **Unit Tests (Vitest)**
   - Utility functions (lib/)
   - Custom hooks
   - State management
   - Data transformations

2. **Component Tests (Testing Library)**
   - UI components
   - Form interactions
   - State changes
   - Error states

3. **Integration Tests**
   - Event CRUD operations
   - Camera workflow
   - Print workflow
   - Template management

4. **E2E Tests (Playwright)**
   - Full capture flow
   - Kiosk mode flow
   - Settings configuration
   - Cross-browser testing

## Files to Create

- `tests/unit/` - Unit tests
  - `lib/events/store.test.ts`
  - `lib/canvas/composer.test.ts`
  - `hooks/useCountdown.test.ts`
- `tests/components/` - Component tests
  - `EventSidebar.test.tsx`
  - `LayoutCanvas.test.tsx`
  - `KioskMode.test.tsx`
- `tests/integration/` - Integration tests
  - `event-management.test.ts`
  - `capture-flow.test.ts`
- `tests/e2e/` - E2E tests (enhance existing)
  - `kiosk-flow.spec.ts`
  - `print-flow.spec.ts`

## Dependencies

```json
{
  "vitest": "^2.x",
  "@testing-library/react": "^15.x",
  "@testing-library/user-event": "^14.x",
  "msw": "^2.x"
}
```

## Coverage Goals

- Unit tests: > 80% coverage
- Component tests: All interactive components
- E2E tests: All critical user flows

## Acceptance Criteria

- [ ] Unit tests for all utility functions
- [ ] Component tests for key components
- [ ] E2E tests pass on CI
- [ ] Coverage reports generated
- [ ] Tests run in under 5 minutes

## Related Spec Sections

- Section 12: Testing
