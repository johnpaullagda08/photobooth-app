/**
 * Printer Discovery Service
 *
 * Handles detection and management of available printers across different connection types:
 * - USB printers via WebUSB API
 * - Network printers (simulated - would need backend in production)
 * - AirPrint printers (simulated - would need native support)
 * - System default printer (always available as fallback)
 */

import type { PrinterConnectionType, PrinterStatus } from '@/lib/events/types';

export interface DiscoveredPrinter {
  id: string;
  name: string;
  model: string;
  connectionType: PrinterConnectionType;
  status: PrinterStatus;
  statusMessage?: string;
  ipAddress?: string;
  macAddress?: string;
  vendorId?: number;
  productId?: number;
  capabilities?: PrinterCapabilities;
  lastSeen: number;
}

export interface PrinterCapabilities {
  colorSupport: boolean;
  duplexSupport: boolean;
  maxResolution: string;
  paperSizes: string[];
  borderless: boolean;
}

// WebUSB supported printer vendors (common photo printers)
export const SUPPORTED_USB_VENDORS = [
  { vendorId: 0x04f9, name: 'Brother', models: ['VC-500W', 'PJ-773', 'QL-820NWB'] },
  { vendorId: 0x1343, name: 'Citizen', models: ['CX-02', 'CY-02', 'CZ-01'] },
  { vendorId: 0x0dd4, name: 'Custom', models: ['KUBE II', 'VKP80III'] },
  { vendorId: 0x04b8, name: 'Epson', models: ['SL-D700', 'SL-D800', 'PictureMate PM-400'] },
  { vendorId: 0x1504, name: 'DNP', models: ['DS-RX1HS', 'DS620A', 'DS820A', 'QW410'] },
  { vendorId: 0x0d16, name: 'HiTi', models: ['P525L', 'P720L', 'P750L', 'P910L'] },
  { vendorId: 0x040a, name: 'Kodak', models: ['305', '605', '6800', '7000'] },
  { vendorId: 0x04a9, name: 'Canon', models: ['SELPHY CP1500', 'SELPHY CP1300', 'SELPHY QX10'] },
  { vendorId: 0x0424, name: 'Mitsubishi', models: ['CP-D70DW', 'CP-D80DW', 'CP-D90DW'] },
  { vendorId: 0x06bc, name: 'Oki', models: ['C844dnw'] },
];

// Store for discovered printers
const discoveredPrinters = new Map<string, DiscoveredPrinter>();
let discoveryListeners: ((printers: DiscoveredPrinter[]) => void)[] = [];
let statusPollingInterval: NodeJS.Timeout | null = null;

/**
 * Check if WebUSB is supported
 */
export function isWebUsbSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/**
 * Scan for USB printers using WebUSB API
 */
export async function scanUsbPrinters(): Promise<DiscoveredPrinter[]> {
  if (!isWebUsbSupported()) {
    return [];
  }

  try {
    const usbNavigator = navigator as Navigator & {
      usb: { getDevices(): Promise<USBDevice[]> }
    };

    const devices = await usbNavigator.usb.getDevices();
    const printers: DiscoveredPrinter[] = [];

    for (const device of devices) {
      const vendor = SUPPORTED_USB_VENDORS.find(v => v.vendorId === device.vendorId);

      if (vendor) {
        const printer: DiscoveredPrinter = {
          id: `usb-${device.vendorId}-${device.productId}`,
          name: device.productName || `${vendor.name} Printer`,
          model: device.productName || vendor.models[0] || 'Unknown Model',
          connectionType: 'usb',
          status: 'online',
          vendorId: device.vendorId,
          productId: device.productId,
          lastSeen: Date.now(),
          capabilities: {
            colorSupport: true,
            duplexSupport: false,
            maxResolution: '300 DPI',
            paperSizes: ['4x6', '5x7', '6x8'],
            borderless: true,
          },
        };
        printers.push(printer);
      }
    }

    return printers;
  } catch (err) {
    console.error('USB printer scan error:', err);
    return [];
  }
}

/**
 * Request USB device pairing from user
 */
export async function requestUsbPrinter(): Promise<DiscoveredPrinter | null> {
  if (!isWebUsbSupported()) {
    throw new Error('WebUSB is not supported in this browser. Please use Chrome or Edge.');
  }

  try {
    const usbNavigator = navigator as Navigator & {
      usb: {
        requestDevice(options: { filters: Array<{ vendorId?: number }> }): Promise<USBDevice>
      }
    };

    const device = await usbNavigator.usb.requestDevice({
      filters: SUPPORTED_USB_VENDORS.map(v => ({ vendorId: v.vendorId })),
    });

    if (device) {
      const vendor = SUPPORTED_USB_VENDORS.find(v => v.vendorId === device.vendorId);

      const printer: DiscoveredPrinter = {
        id: `usb-${device.vendorId}-${device.productId}`,
        name: device.productName || `${vendor?.name || 'Unknown'} Printer`,
        model: device.productName || vendor?.models[0] || 'Unknown Model',
        connectionType: 'usb',
        status: 'online',
        vendorId: device.vendorId,
        productId: device.productId,
        lastSeen: Date.now(),
        capabilities: {
          colorSupport: true,
          duplexSupport: false,
          maxResolution: '300 DPI',
          paperSizes: ['4x6', '5x7', '6x8'],
          borderless: true,
        },
      };

      discoveredPrinters.set(printer.id, printer);
      notifyListeners();
      return printer;
    }
  } catch (err) {
    if ((err as Error).name !== 'NotFoundError') {
      throw err;
    }
  }

  return null;
}

/**
 * Scan for network printers
 * Note: In a real implementation, this would use a backend service
 * to perform mDNS/Bonjour discovery for AirPrint printers
 */
export async function scanNetworkPrinters(): Promise<DiscoveredPrinter[]> {
  // In a production app, this would call a backend API that uses:
  // - mDNS/Bonjour for AirPrint discovery
  // - SNMP for network printer status
  // - IPP (Internet Printing Protocol) for printer info

  // For demo purposes, we'll check if there's a stored network printer config
  // or return an empty array. In production, replace with actual API call.

  try {
    // Check localStorage for manually configured network printers
    const savedPrinters = localStorage.getItem('photobooth-network-printers');
    if (savedPrinters) {
      const printers = JSON.parse(savedPrinters) as DiscoveredPrinter[];
      // Update lastSeen and verify status
      return printers.map(p => ({
        ...p,
        lastSeen: Date.now(),
        status: 'unknown' as PrinterStatus, // Would verify in production
      }));
    }
  } catch (err) {
    console.error('Failed to load saved network printers:', err);
  }

  return [];
}

/**
 * Create system default printer entry
 */
export function getSystemPrinter(): DiscoveredPrinter {
  return {
    id: 'system-default',
    name: 'System Default Printer',
    model: 'Browser Print Dialog',
    connectionType: 'system',
    status: 'online',
    statusMessage: 'Uses your system print dialog',
    lastSeen: Date.now(),
    capabilities: {
      colorSupport: true,
      duplexSupport: true,
      maxResolution: 'Varies',
      paperSizes: ['4x6', '5x7', '6x8', 'Letter', 'A4'],
      borderless: true,
    },
  };
}

/**
 * Perform full printer discovery
 */
export async function discoverAllPrinters(): Promise<DiscoveredPrinter[]> {
  const results: DiscoveredPrinter[] = [];

  // Always add system printer first
  results.push(getSystemPrinter());

  // Scan USB printers
  try {
    const usbPrinters = await scanUsbPrinters();
    results.push(...usbPrinters);
  } catch (err) {
    console.error('USB scan failed:', err);
  }

  // Scan network printers
  try {
    const networkPrinters = await scanNetworkPrinters();
    results.push(...networkPrinters);
  } catch (err) {
    console.error('Network scan failed:', err);
  }

  // Update discovered printers store
  discoveredPrinters.clear();
  results.forEach(p => discoveredPrinters.set(p.id, p));
  notifyListeners();

  return results;
}

/**
 * Add a network printer manually
 */
export function addNetworkPrinter(config: {
  name: string;
  ipAddress: string;
  model?: string;
  connectionType?: 'network' | 'airprint';
}): DiscoveredPrinter {
  const printer: DiscoveredPrinter = {
    id: `network-${config.ipAddress.replace(/\./g, '-')}`,
    name: config.name,
    model: config.model || 'Network Printer',
    connectionType: config.connectionType || 'network',
    status: 'unknown',
    ipAddress: config.ipAddress,
    lastSeen: Date.now(),
    capabilities: {
      colorSupport: true,
      duplexSupport: true,
      maxResolution: '300 DPI',
      paperSizes: ['4x6', '5x7', '6x8'],
      borderless: true,
    },
  };

  discoveredPrinters.set(printer.id, printer);

  // Save to localStorage
  saveNetworkPrinters();
  notifyListeners();

  return printer;
}

/**
 * Remove a network printer
 */
export function removeNetworkPrinter(printerId: string): void {
  discoveredPrinters.delete(printerId);
  saveNetworkPrinters();
  notifyListeners();
}

/**
 * Save network printers to localStorage
 */
function saveNetworkPrinters(): void {
  const networkPrinters = Array.from(discoveredPrinters.values())
    .filter(p => p.connectionType === 'network' || p.connectionType === 'airprint');

  localStorage.setItem('photobooth-network-printers', JSON.stringify(networkPrinters));
}

/**
 * Check printer status
 */
export async function checkPrinterStatus(printer: DiscoveredPrinter): Promise<PrinterStatus> {
  switch (printer.connectionType) {
    case 'usb':
      // For USB, check if device is still connected
      if (isWebUsbSupported()) {
        try {
          const usbNavigator = navigator as Navigator & {
            usb: { getDevices(): Promise<USBDevice[]> }
          };
          const devices = await usbNavigator.usb.getDevices();
          const found = devices.some(d =>
            `usb-${d.vendorId}-${d.productId}` === printer.id
          );
          return found ? 'online' : 'offline';
        } catch {
          return 'unknown';
        }
      }
      return 'unknown';

    case 'network':
    case 'airprint':
      // In production, would ping the printer or use IPP
      return 'unknown';

    case 'system':
      // System printer is always available
      return 'online';

    default:
      return 'unknown';
  }
}

/**
 * Subscribe to printer discovery updates
 */
export function subscribeToPrinterUpdates(
  listener: (printers: DiscoveredPrinter[]) => void
): () => void {
  discoveryListeners.push(listener);

  // Return unsubscribe function
  return () => {
    discoveryListeners = discoveryListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all listeners of printer updates
 */
function notifyListeners(): void {
  const printers = Array.from(discoveredPrinters.values());
  discoveryListeners.forEach(listener => listener(printers));
}

/**
 * Start periodic status polling
 */
export function startStatusPolling(intervalMs: number = 5000): void {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
  }

  statusPollingInterval = setInterval(async () => {
    const printers = Array.from(discoveredPrinters.values());
    let updated = false;

    for (const printer of printers) {
      if (printer.connectionType !== 'system') {
        const newStatus = await checkPrinterStatus(printer);
        if (newStatus !== printer.status) {
          printer.status = newStatus;
          printer.lastSeen = Date.now();
          updated = true;
        }
      }
    }

    if (updated) {
      notifyListeners();
    }
  }, intervalMs);
}

/**
 * Stop status polling
 */
export function stopStatusPolling(): void {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
    statusPollingInterval = null;
  }
}

/**
 * Setup USB device connection/disconnection listeners
 */
export function setupUsbListeners(): () => void {
  if (!isWebUsbSupported()) {
    return () => {};
  }

  const usbNavigator = navigator as Navigator & {
    usb: {
      addEventListener(type: string, listener: () => void): void;
      removeEventListener(type: string, listener: () => void): void;
    };
  };

  const handleConnect = () => {
    discoverAllPrinters();
  };

  const handleDisconnect = () => {
    discoverAllPrinters();
  };

  usbNavigator.usb.addEventListener('connect', handleConnect);
  usbNavigator.usb.addEventListener('disconnect', handleDisconnect);

  return () => {
    usbNavigator.usb.removeEventListener('connect', handleConnect);
    usbNavigator.usb.removeEventListener('disconnect', handleDisconnect);
  };
}

/**
 * Get printer by ID
 */
export function getPrinterById(id: string): DiscoveredPrinter | undefined {
  return discoveredPrinters.get(id);
}

/**
 * Get all discovered printers
 */
export function getAllPrinters(): DiscoveredPrinter[] {
  return Array.from(discoveredPrinters.values());
}

/**
 * Format printer status for display
 */
export function formatPrinterStatus(status: PrinterStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'online':
      return { label: 'Online', color: 'text-green-500', bgColor: 'bg-green-500/10' };
    case 'offline':
      return { label: 'Offline', color: 'text-red-500', bgColor: 'bg-red-500/10' };
    case 'busy':
      return { label: 'Busy', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
    case 'error':
      return { label: 'Error', color: 'text-red-500', bgColor: 'bg-red-500/10' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-500/10' };
  }
}

/**
 * Get connection type icon name
 */
export function getConnectionTypeIcon(type: PrinterConnectionType): string {
  switch (type) {
    case 'usb': return 'usb';
    case 'network': return 'wifi';
    case 'airprint': return 'airplay';
    case 'bluetooth': return 'bluetooth';
    case 'system': return 'monitor';
    default: return 'printer';
  }
}

/**
 * Format connection type for display
 */
export function formatConnectionType(type: PrinterConnectionType): string {
  switch (type) {
    case 'usb': return 'USB Connection';
    case 'network': return 'Wi-Fi / Network';
    case 'airprint': return 'AirPrint';
    case 'bluetooth': return 'Bluetooth';
    case 'system': return 'System Printer';
    default: return 'Unknown';
  }
}
