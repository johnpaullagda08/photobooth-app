import type { PrinterConfig } from '@/types';

// Printer connection status
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface PrinterConnection {
  config: PrinterConfig;
  status: ConnectionStatus;
  error?: string;
  device?: USBDevice;
}

// Store active connections
const connections = new Map<string, PrinterConnection>();

/**
 * Connect to a printer
 */
export async function connectPrinter(config: PrinterConfig): Promise<PrinterConnection> {
  const connection: PrinterConnection = {
    config,
    status: 'connecting',
  };

  try {
    switch (config.connectionType) {
      case 'usb':
        if ('usb' in navigator) {
          // Try to find existing device or request new one
          const devices = await navigator.usb.getDevices();
          let device = devices.find(
            (d) => d.serialNumber === config.id || `usb-${d.productId}` === config.id
          );

          if (!device) {
            // Request new device
            device = await navigator.usb.requestDevice({
              filters: [
                { vendorId: 0x1343 }, // DNP
                { vendorId: 0x04c5 }, // Fujitsu/HiTi
              ],
            });
          }

          if (device) {
            await device.open();
            connection.device = device;
            connection.status = 'connected';
          } else {
            throw new Error('No USB printer found');
          }
        } else {
          throw new Error('WebUSB not supported');
        }
        break;

      case 'network':
        // Test network connection
        if (config.address) {
          const response = await fetch(`/api/print/status?address=${encodeURIComponent(config.address)}`);
          if (response.ok) {
            connection.status = 'connected';
          } else {
            throw new Error('Printer not reachable');
          }
        } else {
          throw new Error('No printer address');
        }
        break;

      case 'browser':
        // Browser printing is always available
        connection.status = 'connected';
        break;

      default:
        connection.status = 'connected';
    }
  } catch (error) {
    connection.status = 'error';
    connection.error = (error as Error).message;
  }

  connections.set(config.id, connection);
  return connection;
}

/**
 * Disconnect from a printer
 */
export async function disconnectPrinter(printerId: string): Promise<void> {
  const connection = connections.get(printerId);

  if (connection?.device) {
    try {
      await connection.device.close();
    } catch (error) {
      console.error('Error closing USB device:', error);
    }
  }

  connections.delete(printerId);
}

/**
 * Get connection status
 */
export function getConnectionStatus(printerId: string): ConnectionStatus {
  return connections.get(printerId)?.status || 'disconnected';
}

/**
 * Get all active connections
 */
export function getActiveConnections(): PrinterConnection[] {
  return Array.from(connections.values());
}

/**
 * Check if printer is ready
 */
export function isPrinterReady(printerId: string): boolean {
  const connection = connections.get(printerId);
  return connection?.status === 'connected';
}
