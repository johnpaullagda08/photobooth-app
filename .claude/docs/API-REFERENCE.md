# API Reference

## Overview

The photobooth uses Next.js API routes for server-side features. These APIs are only available when running the full server (not on static deployments like Cloudflare Pages).

## Camera APIs

### GET /api/camera/devices

Lists all available camera devices, including gPhoto2-detected DSLRs.

**Response**:
```json
{
  "devices": [
    {
      "deviceId": "abc123",
      "label": "HD Webcam",
      "type": "webcam",
      "source": "mediadevices"
    },
    {
      "deviceId": "dslr_001",
      "label": "Canon EOS 5D Mark IV",
      "type": "dslr",
      "source": "gphoto2",
      "port": "usb:001,002"
    }
  ]
}
```

### POST /api/camera/capture

Triggers a capture on the tethered DSLR camera.

**Request**:
```json
{
  "deviceId": "dslr_001",
  "options": {
    "format": "jpeg",
    "quality": "high"
  }
}
```

**Response**:
```json
{
  "success": true,
  "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "filename": "IMG_1234.JPG",
  "timestamp": 1738800000000
}
```

**Errors**:
```json
{
  "success": false,
  "error": "Camera not connected",
  "code": "CAMERA_NOT_FOUND"
}
```

### GET /api/camera/tether

Returns information about the currently tethered camera.

**Response**:
```json
{
  "connected": true,
  "camera": {
    "model": "Canon EOS 5D Mark IV",
    "serial": "123456789",
    "port": "usb:001,002",
    "battery": 75,
    "storage": {
      "available": "28.5 GB",
      "total": "32 GB"
    }
  }
}
```

### POST /api/camera/settings

Updates camera settings (exposure, ISO, etc.).

**Request**:
```json
{
  "deviceId": "dslr_001",
  "settings": {
    "iso": "400",
    "aperture": "5.6",
    "shutterSpeed": "1/125"
  }
}
```

**Response**:
```json
{
  "success": true,
  "settings": {
    "iso": "400",
    "aperture": "5.6",
    "shutterSpeed": "1/125"
  }
}
```

## WiFi Camera API

### POST /api/wifi/poll

Polls the specified folder for new images from WiFi-enabled cameras.

**Request**:
```json
{
  "folderPath": "/path/to/wifi-folder",
  "since": 1738800000000,
  "extensions": [".jpg", ".jpeg", ".raw", ".cr2", ".nef"]
}
```

**Response**:
```json
{
  "images": [
    {
      "filename": "DSC_0001.JPG",
      "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
      "timestamp": 1738800001000,
      "size": 4500000
    }
  ],
  "pollTimestamp": 1738800002000
}
```

### GET /api/wifi/status

Returns the status of WiFi folder watching.

**Response**:
```json
{
  "watching": true,
  "folderPath": "/path/to/wifi-folder",
  "lastImage": {
    "filename": "DSC_0001.JPG",
    "timestamp": 1738800001000
  },
  "totalImages": 42
}
```

## Print APIs (Future)

### POST /api/print/queue

Adds a print job to the queue.

**Request**:
```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "copies": 2,
  "paperSize": "4x6",
  "printerId": "printer_001"
}
```

**Response**:
```json
{
  "success": true,
  "jobId": "job_abc123",
  "position": 3,
  "estimatedTime": 45
}
```

### GET /api/print/queue

Returns the current print queue status.

**Response**:
```json
{
  "jobs": [
    {
      "id": "job_abc123",
      "status": "printing",
      "progress": 65,
      "copies": 2,
      "copiesCompleted": 1
    },
    {
      "id": "job_def456",
      "status": "queued",
      "position": 1
    }
  ],
  "printerStatus": {
    "connected": true,
    "paper": "available",
    "ink": "ok"
  }
}
```

### DELETE /api/print/queue/:jobId

Cancels a print job.

**Response**:
```json
{
  "success": true,
  "message": "Job cancelled"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CAMERA_NOT_FOUND` | 404 | Camera not connected or not found |
| `CAMERA_BUSY` | 409 | Camera is currently in use |
| `CAPTURE_FAILED` | 500 | Failed to capture image |
| `GPHOTO_NOT_INSTALLED` | 501 | gPhoto2 not installed on server |
| `FOLDER_NOT_FOUND` | 404 | WiFi folder path not found |
| `PERMISSION_DENIED` | 403 | No permission to access resource |
| `PRINTER_NOT_CONNECTED` | 404 | Printer not connected |
| `PRINTER_ERROR` | 500 | Printer error occurred |
| `QUEUE_FULL` | 429 | Print queue is full |
| `INVALID_REQUEST` | 400 | Invalid request parameters |

## Authentication (Future)

For multi-user deployments, APIs can be protected with authentication:

### Headers

```
Authorization: Bearer <token>
```

### Endpoints

```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/session
```

## Rate Limiting (Future)

| Endpoint | Limit |
|----------|-------|
| `/api/camera/capture` | 2 req/sec |
| `/api/wifi/poll` | 10 req/sec |
| `/api/print/queue` | 5 req/sec |

## WebSocket Events (Future)

For real-time updates:

```javascript
const ws = new WebSocket('wss://host/api/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'camera:connected':
      // Handle camera connection
      break;
    case 'capture:complete':
      // Handle capture completion
      break;
    case 'print:progress':
      // Handle print progress
      break;
  }
};
```

## SDK Usage

### Camera Client

```typescript
import { CameraClient } from '@/lib/camera/client';

const camera = new CameraClient();

// List devices
const devices = await camera.getDevices();

// Capture photo
const photo = await camera.capture(deviceId);

// Get tether status
const status = await camera.getTetherStatus();
```

### Print Client

```typescript
import { PrintClient } from '@/lib/printing/client';

const printer = new PrintClient();

// Queue print job
const job = await printer.queue({
  imageData,
  copies: 2,
  paperSize: '4x6'
});

// Get queue status
const queue = await printer.getQueue();

// Cancel job
await printer.cancel(jobId);
```
