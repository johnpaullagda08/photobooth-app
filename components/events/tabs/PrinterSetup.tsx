'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Usb,
  Settings,
  TestTube,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PrinterConfig } from '@/lib/events/types';

interface PrinterSetupProps {
  config: PrinterConfig;
  onUpdate: (config: PrinterConfig) => void;
}

interface DetectedPrinter {
  id: string;
  name: string;
  type: 'usb' | 'system';
  status: 'ready' | 'checking' | 'unavailable';
  vendorId?: number;
  productId?: number;
}

// WebUSB supported printer vendors (common thermal photo printers)
const SUPPORTED_VENDORS = [
  { vendorId: 0x04f9, name: 'Brother' },
  { vendorId: 0x1343, name: 'Citizen' },
  { vendorId: 0x0dd4, name: 'Custom' },
  { vendorId: 0x04b8, name: 'Epson' },
  { vendorId: 0x1504, name: 'DNP' },
  { vendorId: 0x0d16, name: 'HiTi' },
  { vendorId: 0x040a, name: 'Kodak' },
  { vendorId: 0x04a9, name: 'Canon' },
];

const statusConfig = {
  ready: { icon: CheckCircle2, label: 'Ready', color: 'text-green-500', bg: 'bg-green-500/10' },
  checking: { icon: RefreshCw, label: 'Checking...', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  unavailable: { icon: XCircle, label: 'Unavailable', color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function PrinterSetup({ config, onUpdate }: PrinterSetupProps) {
  const [printers, setPrinters] = useState<DetectedPrinter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webUsbSupported, setWebUsbSupported] = useState(false);

  // Check WebUSB support on mount
  useEffect(() => {
    setWebUsbSupported('usb' in navigator);
  }, []);

  // Scan for USB printers using WebUSB API
  const scanForUsbPrinters = useCallback(async (): Promise<DetectedPrinter[]> => {
    if (!('usb' in navigator)) {
      return [];
    }

    try {
      // Get already paired devices
      const devices = await (navigator as Navigator & { usb: { getDevices(): Promise<USBDevice[]> } }).usb.getDevices();

      const printers: DetectedPrinter[] = devices
        .filter(device => {
          // Check if it's a known printer vendor
          return SUPPORTED_VENDORS.some(v => v.vendorId === device.vendorId);
        })
        .map(device => {
          const vendor = SUPPORTED_VENDORS.find(v => v.vendorId === device.vendorId);
          return {
            id: `usb-${device.vendorId}-${device.productId}`,
            name: device.productName || `${vendor?.name || 'Unknown'} Printer`,
            type: 'usb' as const,
            status: 'ready' as const,
            vendorId: device.vendorId,
            productId: device.productId,
          };
        });

      return printers;
    } catch (err) {
      console.error('WebUSB error:', err);
      return [];
    }
  }, []);

  // Request USB device pairing
  const requestUsbPrinter = async () => {
    if (!('usb' in navigator)) {
      setError('WebUSB is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    try {
      const usbNavigator = navigator as Navigator & {
        usb: {
          requestDevice(options: { filters: Array<{ vendorId?: number }> }): Promise<USBDevice>
        }
      };

      // Request any USB device - user will select from system dialog
      const device = await usbNavigator.usb.requestDevice({
        filters: SUPPORTED_VENDORS.map(v => ({ vendorId: v.vendorId })),
      });

      if (device) {
        // Re-scan to include the newly paired device
        await scanForPrinters();
      }
    } catch (err) {
      // User cancelled or no device selected
      if ((err as Error).name !== 'NotFoundError') {
        setError('Failed to connect to USB printer.');
        console.error('USB request error:', err);
      }
    }
  };

  // Main scan function
  const scanForPrinters = async () => {
    setIsScanning(true);
    setError(null);

    try {
      const usbPrinters = await scanForUsbPrinters();

      // Always add system printer option
      const systemPrinter: DetectedPrinter = {
        id: 'system-default',
        name: 'System Default Printer',
        type: 'system',
        status: 'ready',
      };

      const allPrinters = [systemPrinter, ...usbPrinters];
      setPrinters(allPrinters);

      // Update connection status if current printer is found
      if (config.selectedPrinterId) {
        const currentPrinter = allPrinters.find((p) => p.id === config.selectedPrinterId);
        if (currentPrinter) {
          onUpdate({
            ...config,
            isConnected: currentPrinter.status === 'ready',
            printerName: currentPrinter.name,
          });
        } else {
          onUpdate({ ...config, isConnected: false });
        }
      }
    } catch (err) {
      setError('Failed to scan for printers.');
      console.error('Printer scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const selectPrinter = (printer: DetectedPrinter) => {
    onUpdate({
      ...config,
      selectedPrinterId: printer.id,
      printerName: printer.name,
      isConnected: printer.status === 'ready',
    });
  };

  const testPrint = async () => {
    if (!config.selectedPrinterId) return;

    setIsPrinting(true);
    try {
      // Create a simple test page
      const testContent = `
        <html>
          <head>
            <title>Printer Test</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 40px;
              }
              .test-box {
                border: 2px solid black;
                padding: 20px;
                margin: 20px auto;
                max-width: 300px;
              }
              h1 { margin-bottom: 10px; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <div class="test-box">
              <h1>Printer Test Page</h1>
              <p>Photobooth App</p>
              <p>${new Date().toLocaleString()}</p>
              <p>If you can read this, your printer is working correctly.</p>
            </div>
          </body>
        </html>
      `;

      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(testContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    } catch (err) {
      setError('Test print failed.');
      console.error('Print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const disconnectPrinter = () => {
    onUpdate({
      ...config,
      selectedPrinterId: null,
      printerName: null,
      isConnected: false,
    });
  };

  // Initial scan
  useEffect(() => {
    scanForPrinters();
  }, []);

  // Listen for USB device changes
  useEffect(() => {
    if (!('usb' in navigator)) return;

    const usbNavigator = navigator as Navigator & {
      usb: {
        addEventListener(type: string, listener: () => void): void;
        removeEventListener(type: string, listener: () => void): void;
      };
    };

    const handleConnect = () => scanForPrinters();
    const handleDisconnect = () => scanForPrinters();

    usbNavigator.usb.addEventListener('connect', handleConnect);
    usbNavigator.usb.addEventListener('disconnect', handleDisconnect);

    return () => {
      usbNavigator.usb.removeEventListener('connect', handleConnect);
      usbNavigator.usb.removeEventListener('disconnect', handleDisconnect);
    };
  }, []);

  const selectedPrinter = printers.find((p) => p.id === config.selectedPrinterId);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  config.isConnected ? 'bg-green-500/10' : 'bg-muted'
                )}
              >
                <Printer
                  className={cn(
                    'h-5 w-5',
                    config.isConnected ? 'text-green-500' : 'text-muted-foreground'
                  )}
                />
              </div>
              <div>
                <CardTitle className="text-base">Printer Status</CardTitle>
                <CardDescription>
                  {config.printerName || 'No printer selected'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={config.isConnected ? 'default' : 'secondary'}>
              {config.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        {config.selectedPrinterId && (
          <CardContent className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testPrint}
              disabled={!config.isConnected || isPrinting}
            >
              <TestTube className={cn('h-4 w-4 mr-2', isPrinting && 'animate-pulse')} />
              {isPrinting ? 'Printing...' : 'Test Print'}
            </Button>
            <Button variant="outline" size="sm" onClick={disconnectPrinter}>
              Disconnect
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Available Printers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Available Printers</CardTitle>
              <CardDescription>Select a printer to connect</CardDescription>
            </div>
            <div className="flex gap-2">
              {webUsbSupported && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestUsbPrinter}
                >
                  <Usb className="h-4 w-4 mr-2" />
                  Add USB
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={scanForPrinters}
                disabled={isScanning}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isScanning && 'animate-spin')} />
                {isScanning ? 'Scanning...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {printers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Printer className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {isScanning ? 'Scanning for printers...' : 'No printers found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {printers.map((printer) => {
                const status = statusConfig[printer.status];
                const StatusIcon = status.icon;
                const isSelected = config.selectedPrinterId === printer.id;

                return (
                  <motion.button
                    key={printer.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => selectPrinter(printer)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors text-left',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        printer.type === 'usb' ? 'bg-blue-500/10' : 'bg-gray-500/10'
                      )}
                    >
                      {printer.type === 'usb' ? (
                        <Usb className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Printer className="h-5 w-5 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{printer.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {printer.type === 'usb' ? 'USB Connection' : 'System Printer (Browser Dialog)'}
                      </p>
                    </div>

                    <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full', status.bg)}>
                      <StatusIcon className={cn('h-4 w-4', status.color, printer.status === 'checking' && 'animate-spin')} />
                      <span className={cn('text-xs font-medium', status.color)}>
                        {status.label}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printer Settings */}
      {selectedPrinter && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <CardTitle className="text-base">Printer Settings</CardTitle>
            </div>
            <CardDescription>Configuration for {selectedPrinter.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Connection Type:</span>
                  <p className="font-medium capitalize">{selectedPrinter.type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium capitalize">{selectedPrinter.status}</p>
                </div>
              </div>

              {selectedPrinter.type === 'system' && (
                <div className="p-3 bg-blue-500/10 rounded-lg text-sm flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-400">System Printer</p>
                    <p className="text-blue-600 dark:text-blue-300 mt-1">
                      Printing will open your system's print dialog where you can select any installed printer.
                    </p>
                  </div>
                </div>
              )}

              {selectedPrinter.type === 'usb' && (
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">USB Printer Features:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Direct printing without dialogs</li>
                    <li>Faster print queue</li>
                    <li>Status monitoring</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Printer Setup Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">USB Printers (Recommended)</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Click "Add USB" to pair a USB printer</li>
                <li>Select your printer from the browser dialog</li>
                <li>Supported: DNP, HiTi, Canon, Epson, Brother, Kodak</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">System Printer</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Works with any printer installed on your computer</li>
                <li>Opens system print dialog for each print</li>
                <li>Good fallback option</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Troubleshooting</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Make sure the printer is powered on</li>
                <li>Check USB cable connection</li>
                <li>Use Chrome or Edge for USB printer support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
