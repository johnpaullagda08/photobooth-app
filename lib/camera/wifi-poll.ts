import * as fs from 'fs/promises';
import * as path from 'path';
import type { WiFiImageResult } from '@/types';
import { WIFI_SUPPORTED_EXTENSIONS } from '@/constants/config';

/**
 * Check if a file has a supported image extension
 */
function isSupportedImage(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return WIFI_SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Poll a folder for new images
 */
export async function pollForNewImages(
  folderPath: string,
  sinceTimestamp: number = 0
): Promise<WiFiImageResult[]> {
  const results: WiFiImageResult[] = [];

  try {
    // Check if folder exists
    const stat = await fs.stat(folderPath);
    if (!stat.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    // Read directory contents
    const files = await fs.readdir(folderPath);

    for (const filename of files) {
      if (!isSupportedImage(filename)) {
        continue;
      }

      const filepath = path.join(folderPath, filename);

      try {
        const fileStat = await fs.stat(filepath);
        const fileTimestamp = fileStat.mtimeMs;

        // Check if file is newer than the since timestamp
        if (fileTimestamp > sinceTimestamp) {
          // Read and encode the image
          const imageBuffer = await fs.readFile(filepath);
          const base64 = imageBuffer.toString('base64');

          // Determine MIME type
          const ext = path.extname(filename).toLowerCase();
          let mimeType = 'image/jpeg';
          if (ext === '.png') {
            mimeType = 'image/png';
          } else if (ext === '.cr2' || ext === '.nef' || ext === '.arw') {
            // RAW files - would need conversion, for now skip
            continue;
          }

          results.push({
            filename,
            imageData: `data:${mimeType};base64,${base64}`,
            timestamp: fileTimestamp,
          });
        }
      } catch {
        // Skip files that can't be read
        continue;
      }
    }

    // Sort by timestamp (oldest first)
    results.sort((a, b) => a.timestamp - b.timestamp);

    return results;
  } catch (error) {
    console.error('WiFi poll error:', error);
    return [];
  }
}

/**
 * Watch a folder for changes using chokidar (for real-time updates)
 */
export function createFolderWatcher(
  folderPath: string,
  onNewImage: (result: WiFiImageResult) => void
) {
  // Dynamic import for server-side only
  const setupWatcher = async () => {
    const chokidar = await import('chokidar');

    const watcher = chokidar.watch(folderPath, {
      ignored: /(^|[\/\\])\../, // Ignore hidden files
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    watcher.on('add', async (filepath) => {
      const filename = path.basename(filepath);

      if (!isSupportedImage(filename)) {
        return;
      }

      try {
        const imageBuffer = await fs.readFile(filepath);
        const base64 = imageBuffer.toString('base64');

        const ext = path.extname(filename).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

        onNewImage({
          filename,
          imageData: `data:${mimeType};base64,${base64}`,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Failed to process new image:', error);
      }
    });

    return watcher;
  };

  return setupWatcher();
}
