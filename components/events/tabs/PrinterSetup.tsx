'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
  Usb,
  Settings,
  TestTube,
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
  type: 'usb' | 'network';
  status: 'ready' | 'busy' | 'error' | 'offline';
}

// Simulated printer detection - in real app, this would use Web USB API or backend
const detectPrinters = async (): Promise<DetectedPrinter[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Return simulated printers for development
  return [
    { id: 'printer-1', name: 'DNP DS-RX1', type: 'usb', status: 'ready' },
    { id: 'printer-2', name: 'HiTi P525L', type: 'usb', status: 'offline' },
    { id: 'printer-3', name: 'Canon SELPHY CP1500', type: 'network', status: 'ready' },
  ];
};

const statusConfig = {
  ready: { icon: CheckCircle2, label: 'Ready', color: 'text-green-500', bg: 'bg-green-500/10' },
  busy: { icon: AlertCircle, label: 'Busy', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  error: { icon: XCircle, label: 'Error', color: 'text-red-500', bg: 'bg-red-500/10' },
  offline: { icon: XCircle, label: 'Offline', color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function PrinterSetup({ config, onUpdate }: PrinterSetupProps) {
  const [printers, setPrinters] = useState<DetectedPrinter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanForPrinters = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const detected = await detectPrinters();
      setPrinters(detected);

      // Update connection status if current printer is found
      if (config.selectedPrinterId) {
        const currentPrinter = detected.find((p) => p.id === config.selectedPrinterId);
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
      setError('Failed to scan for printers. Please check connections.');
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
      // Simulate test print
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // In real app, would send test page to printer
    } catch (err) {
      setError('Test print failed. Please check printer.');
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

  useEffect(() => {
    scanForPrinters();
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
            <Button
              variant="outline"
              size="sm"
              onClick={scanForPrinters}
              disabled={isScanning}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isScanning && 'animate-spin')} />
              {isScanning ? 'Scanning...' : 'Scan'}
            </Button>
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
              <p className="text-xs mt-1">
                Make sure your printer is connected and powered on.
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
                        printer.type === 'usb' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                      )}
                    >
                      {printer.type === 'usb' ? (
                        <Usb
                          className={cn(
                            'h-5 w-5',
                            printer.type === 'usb' ? 'text-blue-500' : 'text-purple-500'
                          )}
                        />
                      ) : (
                        <Wifi className="h-5 w-5 text-purple-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{printer.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {printer.type === 'usb' ? 'USB Connection' : 'Network Printer'}
                      </p>
                    </div>

                    <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full', status.bg)}>
                      <StatusIcon className={cn('h-4 w-4', status.color)} />
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

              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Supported Features:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>4x6 and 5x7 paper sizes</li>
                  <li>High quality photo printing</li>
                  <li>Borderless printing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Printer not showing?</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Make sure the printer is powered on</li>
                <li>Check USB or network connection</li>
                <li>Install the latest printer drivers</li>
                <li>Try clicking "Scan" to refresh</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Print quality issues?</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Clean the print head</li>
                <li>Use recommended paper</li>
                <li>Check ink/ribbon levels</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
