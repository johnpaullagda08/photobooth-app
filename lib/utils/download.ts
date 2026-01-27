/**
 * Download a file from a URL or blob
 */
export function downloadFile(
  data: string | Blob,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void {
  let url: string;
  let shouldRevokeUrl = false;

  if (typeof data === 'string') {
    // Data URL or regular URL
    if (data.startsWith('data:') || data.startsWith('http')) {
      url = data;
    } else {
      // Treat as text content
      const blob = new Blob([data], { type: mimeType });
      url = URL.createObjectURL(blob);
      shouldRevokeUrl = true;
    }
  } else {
    // Blob
    url = URL.createObjectURL(data);
    shouldRevokeUrl = true;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (shouldRevokeUrl) {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

/**
 * Download canvas as image file
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.92
): void {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, quality);
  downloadFile(dataUrl, filename, mimeType);
}

/**
 * Download image from data URL
 */
export function downloadImageFromDataUrl(
  dataUrl: string,
  filename: string
): void {
  downloadFile(dataUrl, filename);
}

/**
 * Create a filename with timestamp
 */
export function createFilename(
  prefix: string = 'photobooth',
  extension: string = 'png'
): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Get file extension from mime type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };

  return map[mimeType] || 'bin';
}

/**
 * Get mime type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
  const ext = extension.toLowerCase().replace('.', '');

  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };

  return map[ext] || 'application/octet-stream';
}
