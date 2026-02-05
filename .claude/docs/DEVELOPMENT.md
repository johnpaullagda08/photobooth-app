# Development Guide

## Prerequisites

- **Node.js**: 18.x or later
- **npm** or **pnpm**: Latest version
- **gPhoto2** (optional): For DSLR tethering feature

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
npm start
```

## Project Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run build:static` | Build static export for Cloudflare |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run deploy:preview` | Deploy preview branch |
| `npm test` | Run Playwright E2E tests |
| `npm run test:ui` | Run tests with Playwright UI |
| `npm run lint` | Run ESLint |

## Environment Variables

Create a `.env.local` file for local configuration:

```env
# Optional: gPhoto2 binary path (defaults to system path)
GPHOTO2_PATH=/usr/local/bin/gphoto2

# Optional: Temp directory for captures
CAPTURE_TEMP_DIR=/tmp/photobooth-captures

# Optional: Enable debug logging
DEBUG=photobooth:*
```

## Code Style

### TypeScript

- Strict mode enabled
- No implicit any
- Use interfaces for object shapes
- Use type for unions/primitives

```typescript
// Good
interface PhotoboothEvent {
  id: string;
  name: string;
}

type PaperSize = 'strip' | '4r';

// Avoid
const event: any = {};
```

### React Components

- Functional components with hooks
- Props interfaces defined above component
- Default exports for pages, named exports for components

```typescript
// components/example/ExampleComponent.tsx

interface ExampleComponentProps {
  title: string;
  onAction: () => void;
}

export function ExampleComponent({ title, onAction }: ExampleComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (prefix with `use`)
- Utilities: `kebab-case.ts`
- Types: `index.ts` in types/ directory

### Import Order

1. React/Next.js imports
2. Third-party libraries
3. Internal components
4. Internal utilities
5. Types
6. Styles

```typescript
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { useEvents } from '@/lib/events';

import type { PhotoboothEvent } from '@/types';
```

## Testing

### E2E Tests (Playwright)

```bash
# Install browsers (first time)
npx playwright install

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific test file
npx playwright test tests/booth.spec.ts

# Debug mode
npx playwright test --debug
```

### Writing Tests

```typescript
// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/booth');
    await page.click('button:has-text("Create Event")');
    await expect(page.locator('.event-item')).toBeVisible();
  });
});
```

## Adding New Features

### 1. Create Component

```bash
# Create component file
touch components/feature/FeatureName.tsx
```

### 2. Add Types (if needed)

```typescript
// types/index.ts
export interface NewFeatureConfig {
  enabled: boolean;
  options: string[];
}
```

### 3. Update Event Model (if needed)

```typescript
// lib/events/types.ts
interface PhotoboothEvent {
  // ...existing
  newFeature: NewFeatureConfig;
}
```

### 4. Create Hook (if needed)

```typescript
// hooks/useNewFeature.ts
export function useNewFeature() {
  // Hook implementation
}
```

### 5. Add to Settings Tab

If the feature needs configuration, add a settings tab or section.

### 6. Write Tests

```typescript
// tests/new-feature.spec.ts
test('new feature works', async ({ page }) => {
  // Test implementation
});
```

## Debugging

### Browser DevTools

- React DevTools extension
- Network tab for API calls
- Console for errors

### VS Code

Launch configuration is included for debugging:

```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Next.js",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}"
}
```

### Common Issues

**Camera not working**
- Check browser permissions
- HTTPS required for network access (except localhost)
- Check if device is in use by another app

**localStorage full**
- Images stored as data URLs can be large
- Clear old events or implement cleanup

**Printer not detected**
- WebUSB requires HTTPS
- Check browser compatibility
- Ensure printer USB drivers aren't blocking

## Performance Tips

### Image Handling

- Compress images before storing
- Use thumbnail sizes for previews
- Lazy load images in galleries

### State Updates

- Avoid unnecessary re-renders
- Use `useMemo` for expensive computations
- Batch localStorage writes

### Bundle Size

- Use dynamic imports for heavy components
- Tree-shake unused utilities
- Check bundle with `next-bundle-analyzer`

## Deployment

### Cloudflare Pages

```bash
# Login to Cloudflare
npx wrangler login

# Deploy
npm run deploy
```

### Local Server (Full Features)

```bash
npm run build
npm start
```

### Docker (optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/area` - Code refactoring
- `docs/topic` - Documentation

### Commit Messages

Follow conventional commits:

```
feat: add social sharing buttons
fix: camera permission error on iOS
docs: update deployment guide
refactor: simplify event store
```

### Pull Requests

1. Create feature branch
2. Make changes
3. Run tests locally
4. Create PR with description
5. Request review
