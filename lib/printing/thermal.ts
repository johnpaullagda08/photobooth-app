import type { PrinterConfig, PrintSize } from '@/types';
import { getPrintBlob } from './formats';

/**
 * Thermal printer interface for photo booths
 * Supports DNP, HiTi, and other dye-sub printers
 */

// Printer connection types
type ConnectionType = 'usb' | 'network' | 'browser';

interface PrintJob {
  id: string;
  status: 'pending' | 'printing' | 'complete' | 'error';
  error?: string;
}

// Check if WebUSB is available
export function isWebUSBSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

// Check if printing is available (browser print or WebUSB)
export function isPrintingAvailable(): boolean {
  return typeof window !== 'undefined' && (isWebUSBSupported() || true); // Always have browser print fallback
}

/**
 * Attempt to connect to a thermal printer via WebUSB
 * Note: This requires user gesture and matching vendor/product IDs
 */
export async function connectUSBPrinter(): Promise<USBDevice | null> {
  if (!isWebUSBSupported()) {
    console.warn('WebUSB not supported');
    return null;
  }

  try {
    // Common thermal printer vendor IDs
    const filters = [
      { vendorId: 0x1343 }, // DNP
      { vendorId: 0x04c5 }, // Fujitsu (HiTi)
      { vendorId: 0x04f9 }, // Brother
      { vendorId: 0x067b }, // Prolific (USB-Serial adapters)
    ];

    const device = await navigator.usb.requestDevice({ filters });
    await device.open();

    console.log('Connected to USB printer:', device.productName);
    return device;
  } catch (error) {
    console.error('Failed to connect to USB printer:', error);
    return null;
  }
}

/**
 * Print using browser's native print dialog
 * This is the most compatible option and works with all printers
 */
export async function browserPrint(imageData: string): Promise<void> {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=600,height=800');

  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }

  // Build the print document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Photo Strip</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: white;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            img {
              width: 100%;
              height: auto;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <img src="${imageData}" alt="Photo Strip" onload="window.print(); setTimeout(window.close, 1000);" />
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Print using network printer (IPP or RAW socket)
 * Note: This requires a backend service to relay print jobs
 */
export async function networkPrint(
  printerAddress: string,
  imageBlob: Blob
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('file', imageBlob, 'photo.jpg');
    formData.append('printer', printerAddress);

    const response = await fetch('/api/print', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Network print failed:', error);
    return false;
  }
}

/**
 * Main print function that handles all printer types
 */
export async function print(
  imageData: string,
  printer: PrinterConfig
): Promise<PrintJob> {
  const jobId = `print-${Date.now()}`;

  const job: PrintJob = {
    id: jobId,
    status: 'pending',
  };

  try {
    job.status = 'printing';

    switch (printer.connectionType) {
      case 'browser':
        await browserPrint(imageData);
        break;

      case 'network':
        if (printer.address) {
          // Convert data URL to blob
          const response = await fetch(imageData);
          const blob = await response.blob();
          const success = await networkPrint(printer.address, blob);
          if (!success) {
            throw new Error('Network print failed');
          }
        } else {
          throw new Error('No printer address configured');
        }
        break;

      case 'usb':
        // USB printing requires more complex handling
        // Fall back to browser print for now
        await browserPrint(imageData);
        break;

      default:
        await browserPrint(imageData);
    }

    job.status = 'complete';
  } catch (error) {
    job.status = 'error';
    job.error = (error as Error).message;
  }

  return job;
}

/**
 * Get default printer configuration (browser print)
 */
export function getDefaultPrinter(): PrinterConfig {
  return {
    id: 'browser',
    name: 'Browser Print',
    type: 'browser',
    connectionType: 'browser',
  };
}

/**
 * Detect available printers
 */
export async function detectPrinters(): Promise<PrinterConfig[]> {
  const printers: PrinterConfig[] = [getDefaultPrinter()];

  // Check for WebUSB devices if supported
  if (isWebUSBSupported()) {
    try {
      const devices = await navigator.usb.getDevices();
      for (const device of devices) {
        printers.push({
          id: `usb-${device.serialNumber || device.productId}`,
          name: device.productName || `USB Printer (${device.vendorId})`,
          type: 'thermal',
          connectionType: 'usb',
        });
      }
    } catch {
      // WebUSB access denied or not available
    }
  }

  return printers;
}
