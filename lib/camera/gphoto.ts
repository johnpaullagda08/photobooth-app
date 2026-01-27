import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { TetheredCamera, TetherCaptureResult } from '@/types';

const TEMP_DIR = '/tmp/photobooth-captures';

// Ensure temp directory exists
async function ensureTempDir(): Promise<void> {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

/**
 * Check if gPhoto2 is installed
 */
export async function isGPhoto2Available(): Promise<boolean> {
  try {
    await execa('gphoto2', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect connected cameras using gPhoto2
 */
export async function detectCameras(): Promise<TetheredCamera[]> {
  try {
    const { stdout } = await execa('gphoto2', ['--auto-detect']);

    // Parse output - format is typically:
    // Model                          Port
    // ----------------------------------------------------------
    // Canon EOS 5D Mark IV           usb:001,004

    const lines = stdout.split('\n');
    const cameras: TetheredCamera[] = [];

    for (const line of lines) {
      // Skip header lines
      if (line.includes('Model') || line.includes('---') || !line.trim()) {
        continue;
      }

      // Match camera model and port
      const match = line.match(/^(.+?)\s+(usb:\d+,\d+)/);
      if (match) {
        cameras.push({
          model: match[1].trim(),
          port: match[2],
        });
      }
    }

    return cameras;
  } catch (error) {
    console.error('Failed to detect cameras:', error);
    return [];
  }
}

/**
 * Capture image from tethered camera
 */
export async function captureImage(port?: string): Promise<TetherCaptureResult> {
  await ensureTempDir();

  const filename = `capture-${Date.now()}.jpg`;
  const filepath = path.join(TEMP_DIR, filename);

  try {
    const args = [
      '--capture-image-and-download',
      `--filename=${filepath}`,
      '--force-overwrite',
    ];

    if (port) {
      args.push(`--port=${port}`);
    }

    await execa('gphoto2', args, { timeout: 30000 });

    // Read the captured image
    const imageBuffer = await fs.readFile(filepath);
    const base64 = imageBuffer.toString('base64');
    const imageData = `data:image/jpeg;base64,${base64}`;

    // Clean up the temp file
    try {
      await fs.unlink(filepath);
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: true,
      imagePath: filepath,
      imageData,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message || 'Capture failed',
    };
  }
}

/**
 * Get camera summary/info
 */
export async function getCameraInfo(port?: string): Promise<string | null> {
  try {
    const args = ['--summary'];
    if (port) {
      args.push(`--port=${port}`);
    }

    const { stdout } = await execa('gphoto2', args);
    return stdout;
  } catch {
    return null;
  }
}

/**
 * Get camera configuration
 */
export async function getCameraConfig(port?: string): Promise<Record<string, string> | null> {
  try {
    const args = ['--list-config'];
    if (port) {
      args.push(`--port=${port}`);
    }

    const { stdout } = await execa('gphoto2', args);

    // Parse config list
    const config: Record<string, string> = {};
    const lines = stdout.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      if (line.startsWith('/')) {
        config[line] = '';
      }
    }

    return config;
  } catch {
    return null;
  }
}
