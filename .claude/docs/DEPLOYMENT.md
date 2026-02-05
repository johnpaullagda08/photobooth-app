# Deployment Guide

## Deployment Options

| Platform | Type | Features | Best For |
|----------|------|----------|----------|
| **Cloudflare Pages** | Static | Webcam, HDMI, templates, export | Public hosting |
| **Vercel** | Serverless | Similar to Cloudflare | Alternative hosting |
| **Local Server** | Full | All features including USB tethering | Event venues |
| **Docker** | Full | All features, portable | Self-hosted |

## Cloudflare Pages (Recommended)

### Live URL

**Production**: https://photobooth-ru7.pages.dev

### Setup

1. **Install Wrangler CLI** (already in devDependencies):
   ```bash
   npm install -D wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   npx wrangler login
   ```

3. **Create Project** (first time only):
   ```bash
   npx wrangler pages project create photobooth --production-branch=main
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

### Deploy Commands

```bash
npm run deploy           # Deploy to production
npm run deploy:preview   # Deploy preview branch
npm run build:static     # Build static export only
```

### Feature Availability on Cloudflare

| Feature | Available | Notes |
|---------|-----------|-------|
| Landing page | Yes | Full animations |
| Event management | Yes | localStorage persistence |
| Webcam capture | Yes | Browser MediaDevices API |
| HDMI capture | Yes | Browser MediaDevices API |
| Mirrorless (USB) | Yes | Browser MediaDevices API |
| Print layout editor | Yes | Canvas-based editor |
| Template backgrounds | Yes | Data URL storage |
| Photo strip generation | Yes | Canvas API |
| Download/export | Yes | Blob download |
| USB tethering (DSLR) | **No** | Requires gPhoto2 server |
| WiFi transfer | **No** | Requires server polling |
| Direct thermal printing | Partial | WebUSB works, no server print queue |

### Environment Variables (Optional)

Cloudflare Pages environment variables can be set in the dashboard:

```
# No required environment variables for static deployment
```

## Vercel Deployment

### Setup

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

### Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "framework": "nextjs"
}
```

## Local Server (Full Features)

### Requirements

- Node.js 18+
- gPhoto2 (for DSLR tethering)
- HTTPS certificate (for network access)

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install gPhoto2** (macOS):
   ```bash
   brew install gphoto2
   ```

3. **Build and start**:
   ```bash
   npm run build
   npm start
   ```

### HTTPS for Network Access

For tablets/iPads to access cameras over the network, HTTPS is required.

**Option 1: ngrok (Easiest)**
```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000
```

**Option 2: Self-signed certificate**
```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Use with custom server (requires modification)
```

**Option 3: mkcert (Local development)**
```bash
# Install mkcert
brew install mkcert

# Create local CA
mkcert -install

# Create certificate
mkcert localhost 192.168.1.100
```

### Environment Variables

Create `.env.local`:

```env
# gPhoto2 path (optional, defaults to system path)
GPHOTO2_PATH=/usr/local/bin/gphoto2

# Temp directory for captures
CAPTURE_TEMP_DIR=/tmp/photobooth-captures

# WiFi camera watch folder
WIFI_WATCH_DIR=/path/to/wifi-folder

# Debug logging
DEBUG=photobooth:*
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install gPhoto2 for DSLR support
RUN apk add --no-cache gphoto2

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  photobooth:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - /dev/bus/usb:/dev/bus/usb  # For USB camera access
    privileged: true  # Required for USB access
    environment:
      - NODE_ENV=production
```

### Build and Run

```bash
# Build image
docker build -t photobooth .

# Run container
docker run -p 3000:3000 -v /dev/bus/usb:/dev/bus/usb --privileged photobooth
```

## PWA Installation

The app includes a web manifest for PWA installation:

```json
{
  "name": "Log the Photobooth",
  "short_name": "Log Photobooth",
  "start_url": "/booth",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#09090b",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Installation

1. Navigate to the app in Chrome/Safari
2. Click "Add to Home Screen" or "Install" in address bar
3. App opens in standalone window

## Production Checklist

### Before Deployment

- [ ] Run all tests: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`

### After Deployment

- [ ] Landing page loads correctly
- [ ] Event creation works
- [ ] Camera permissions work
- [ ] Photo capture functions
- [ ] Download works
- [ ] Mobile/tablet responsive
- [ ] PWA installable

### Performance

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s

### Security

- [ ] HTTPS enabled
- [ ] No sensitive data in client-side code
- [ ] Content Security Policy headers
- [ ] Rate limiting on API routes (if applicable)

## Monitoring

### Analytics (Optional)

Add analytics via environment variable:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Error Tracking (Optional)

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

Configure in `sentry.client.config.js`:

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

## Rollback

### Cloudflare Pages

1. Go to Cloudflare Dashboard > Pages > photobooth
2. Click "Deployments"
3. Find previous deployment
4. Click "Rollback to this deployment"

### Vercel

```bash
vercel rollback
```

### Docker

```bash
# Tag releases
docker tag photobooth:latest photobooth:v1.0.0

# Rollback to previous version
docker run -p 3000:3000 photobooth:v1.0.0
```
