# Log the Photobooth - Documentation

Welcome to the documentation for Log the Photobooth, a modern browser-based photobooth application.

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture](./ARCHITECTURE.md) | System architecture, directory structure, state management |
| [Components](./COMPONENTS.md) | React component reference and usage |
| [Development](./DEVELOPMENT.md) | Development setup, code style, testing |
| [Data Models](./DATA-MODELS.md) | TypeScript interfaces and data structures |
| [Camera System](./CAMERA-SYSTEM.md) | Camera sources, device detection, capture flow |
| [Printing](./PRINTING.md) | Print methods, layouts, color correction |
| [Deployment](./DEPLOYMENT.md) | Deploy to Cloudflare, Vercel, Docker |
| [API Reference](./API-REFERENCE.md) | Server-side API endpoints |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd photobooth-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Create Your First Event

1. Navigate to `/booth`
2. Click "Create Event"
3. Select paper size (2x6 strip or 4x6)
4. Configure settings in each tab
5. Click "Launch Kiosk" to start

## Features

### Core Features

- **Event Management**: Create and manage multiple events
- **Multi-Camera Support**: Webcam, HDMI capture, mirrorless cameras
- **Print Layout Editor**: Drag-and-drop photo positioning
- **Template System**: Save and reuse layouts
- **Kiosk Mode**: Fullscreen touchscreen interface
- **Photo Filters**: 8 real-time CSS filters
- **Instant Printing**: WebUSB thermal printer support

### Paper Sizes

| Size | Dimensions | Use Case |
|------|------------|----------|
| 2x6 Strip | 600 x 1800 px | Traditional photo strips |
| 4x6 (4R) | 1200 x 1800 px | Standard photos |

### Camera Sources

| Source | Requirements | Features |
|--------|--------------|----------|
| Webcam | Browser support | Basic capture |
| HDMI | Capture card | Professional cameras |
| USB Tether | Local server + gPhoto2 | Direct DSLR control |
| WiFi | Local server | Wireless transfer |

## Technology Stack

- **Framework**: Next.js 16.1.4
- **Language**: TypeScript 5
- **UI**: React 19, Tailwind CSS 4, shadcn/ui
- **Animation**: Framer Motion
- **Testing**: Playwright
- **Deployment**: Cloudflare Pages

## Project Structure

```
photobooth-app/
├── app/                # Next.js pages
├── components/         # React components
├── hooks/              # Custom hooks
├── lib/                # Utilities
├── types/              # TypeScript types
├── public/             # Static assets
└── tests/              # E2E tests
```

## Common Tasks

### Add a New Filter

1. Edit `components/filters/filters.ts`
2. Add filter definition with CSS filter string
3. Update filter selector UI

### Add a New Template

1. Edit `lib/events/templates.ts`
2. Define box positions
3. Add to template panel

### Change Default Settings

1. Edit `constants/config.ts`
2. Update default event configuration

## Troubleshooting

### Camera Issues

- Check browser permissions
- HTTPS required for network access
- Try different browser (Chrome recommended)

### Print Issues

- WebUSB requires HTTPS
- Check printer connection
- Try browser print as fallback

### Performance Issues

- Reduce camera resolution
- Close other applications
- Check device capabilities

## Support

**Developer**: John Paul Lagda
**Email**: johnpaullagda08@gmail.com
**Facebook**: https://facebook.com/johnpaullagda08

## License

MIT License - See LICENSE file for details.
