'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Usb,
  Wifi,
  Monitor,
  Settings,
  TestTube,
  Info,
  Plus,
  Trash2,
  Bluetooth,
  Signal,
  Globe,
  ChevronDown,
  ChevronUp,
  Airplay,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PrinterConfig, PrinterConnectionType, PrinterStatus } from '@/lib/events/types';
import {
  discoverAllPrinters,
  requestUsbPrinter,
  addNetworkPrinter,
  removeNetworkPrinter,
  subscribeToPrinterUpdates,
  setupUsbListeners,
  startStatusPolling,
  stopStatusPolling,
  isWebUsbSupported,
  formatPrinterStatus,
  formatConnectionType,
  type DiscoveredPrinter,
} from '@/lib/printing/printer-discovery';

interface PrinterSetupProps {
  config: PrinterConfig;
  onUpdate: (config: PrinterConfig) => void;
}

// Connection type icon mapping
const ConnectionIcon = ({ type }: { type: PrinterConnectionType }) => {
  switch (type) {
    case 'usb':
      return <Usb className="h-5 w-5" />;
    case 'network':
      return <Wifi className="h-5 w-5" />;
    case 'airprint':
      return <Airplay className="h-5 w-5" />;
    case 'bluetooth':
      return <Bluetooth className="h-5 w-5" />;
    case 'system':
      return <Monitor className="h-5 w-5" />;
    default:
      return <Printer className="h-5 w-5" />;
  }
};

// Status icon component
const StatusIcon = ({ status }: { status: PrinterStatus }) => {
  switch (status) {
    case 'online':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'offline':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'busy':
      return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Signal className="h-4 w-4 text-gray-500" />;
  }
};

export function PrinterSetup({ config, onUpdate }: PrinterSetupProps) {
  const [printers, setPrinters] = useState<DiscoveredPrinter[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [networkForm, setNetworkForm] = useState({ name: '', ipAddress: '', model: '' });

  // Scan for printers
  const scanForPrinters = useCallback(async () => {
    setIsScanning(true);
    setError(null);

    try {
      const discovered = await discoverAllPrinters();
      setPrinters(discovered);

      // Update connection status if current printer is found
      if (config.selectedPrinterId) {
        const currentPrinter = discovered.find(p => p.id === config.selectedPrinterId);
        if (currentPrinter) {
          onUpdate({
            ...config,
            isConnected: currentPrinter.status === 'online',
            printerName: currentPrinter.name,
            connectionType: currentPrinter.connectionType,
            printerModel: currentPrinter.model,
            ipAddress: currentPrinter.ipAddress,
          });
        } else {
          onUpdate({ ...config, isConnected: false });
        }
      }
    } catch (err) {
      setError('Failed to scan for printers. Please try again.');
      console.error('Printer scan error:', err);
    } finally {
      setIsScanning(false);
    }
  }, [config, onUpdate]);

  // Initial scan and setup listeners
  useEffect(() => {
    // Scan on mount
    scanForPrinters();

    // Subscribe to printer updates
    const unsubscribe = subscribeToPrinterUpdates((updatedPrinters) => {
      setPrinters(updatedPrinters);
    });

    // Setup USB listeners
    const cleanupUsb = setupUsbListeners();

    // Start status polling (every 10 seconds)
    startStatusPolling(10000);

    return () => {
      unsubscribe();
      cleanupUsb();
      stopStatusPolling();
    };
  }, []);

  // Request USB printer pairing
  const handleAddUsbPrinter = async () => {
    try {
      setError(null);
      const printer = await requestUsbPrinter();
      if (printer) {
        await scanForPrinters();
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Add network printer
  const handleAddNetworkPrinter = () => {
    if (!networkForm.name || !networkForm.ipAddress) {
      setError('Please enter both printer name and IP address.');
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(networkForm.ipAddress)) {
      setError('Please enter a valid IP address (e.g., 192.168.1.100).');
      return;
    }

    addNetworkPrinter({
      name: networkForm.name,
      ipAddress: networkForm.ipAddress,
      model: networkForm.model || undefined,
      connectionType: 'network',
    });

    setNetworkForm({ name: '', ipAddress: '', model: '' });
    setShowAddNetwork(false);
    scanForPrinters();
  };

  // Remove network printer
  const handleRemoveNetworkPrinter = (printerId: string) => {
    removeNetworkPrinter(printerId);
    if (config.selectedPrinterId === printerId) {
      onUpdate({
        ...config,
        selectedPrinterId: null,
        printerName: null,
        isConnected: false,
      });
    }
  };

  // Select printer
  const selectPrinter = (printer: DiscoveredPrinter) => {
    onUpdate({
      ...config,
      selectedPrinterId: printer.id,
      printerName: printer.name,
      isConnected: printer.status === 'online',
      connectionType: printer.connectionType,
      printerModel: printer.model,
      ipAddress: printer.ipAddress,
    });
  };

  // Disconnect printer
  const disconnectPrinter = () => {
    onUpdate({
      ...config,
      selectedPrinterId: null,
      printerName: null,
      isConnected: false,
      connectionType: undefined,
      printerModel: undefined,
      ipAddress: undefined,
    });
  };

  // Test print
  const testPrint = async () => {
    if (!config.selectedPrinterId) return;

    setIsPrinting(true);
    try {
      const testContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Printer Test</title>
            <style>
              @page { size: 4in 6in; margin: 0; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                box-sizing: border-box;
              }
              .test-box {
                background: white;
                color: #333;
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              }
              h1 { margin: 0 0 10px; font-size: 24px; }
              .check { font-size: 48px; margin-bottom: 20px; }
              .info { font-size: 12px; color: #666; margin-top: 20px; }
              .printer { font-weight: bold; color: #764ba2; }
            </style>
          </head>
          <body>
            <div class="test-box">
              <div class="check">&#10004;</div>
              <h1>Printer Test Successful</h1>
              <p>Log the Photobooth</p>
              <p class="printer">${config.printerName || 'Unknown Printer'}</p>
              <p class="info">${new Date().toLocaleString()}</p>
              <p class="info">If you can read this, your printer is working correctly.</p>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(testContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    } catch (err) {
      setError('Test print failed. Please check your printer connection.');
      console.error('Print error:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const selectedPrinter = printers.find(p => p.id === config.selectedPrinterId);
  const webUsbSupported = isWebUsbSupported();

  // Group printers by connection type
  const groupedPrinters = {
    usb: printers.filter(p => p.connectionType === 'usb'),
    network: printers.filter(p => p.connectionType === 'network' || p.connectionType === 'airprint'),
    system: printers.filter(p => p.connectionType === 'system'),
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Connection Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-xl',
                  config.isConnected ? 'bg-green-500/10' : 'bg-muted'
                )}
              >
                <Printer
                  className={cn(
                    'h-6 w-6',
                    config.isConnected ? 'text-green-500' : 'text-muted-foreground'
                  )}
                />
              </div>
              <div>
                <CardTitle className="text-lg">Printer Status</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-0.5">
                  {config.printerName ? (
                    <>
                      <span>{config.printerName}</span>
                      {config.connectionType && (
                        <Badge variant="outline" className="text-xs">
                          {formatConnectionType(config.connectionType)}
                        </Badge>
                      )}
                    </>
                  ) : (
                    'No printer selected'
                  )}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={config.isConnected ? 'default' : 'secondary'}
              className={cn(
                'text-sm px-3 py-1',
                config.isConnected && 'bg-green-500 hover:bg-green-600'
              )}
            >
              {config.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        {config.selectedPrinterId && (
          <CardContent className="pt-0">
            <div className="flex gap-2 flex-wrap">
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
              {selectedPrinter?.model && (
                <div className="flex-1 text-right text-sm text-muted-foreground">
                  Model: {selectedPrinter.model}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Available Printers Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Available Printers
                {printers.length > 0 && (
                  <Badge variant="secondary" className="font-normal">
                    {printers.length} found
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Printers are detected automatically. Select one to connect.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {webUsbSupported && (
                <Button variant="outline" size="sm" onClick={handleAddUsbPrinter}>
                  <Usb className="h-4 w-4 mr-2" />
                  Add USB
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddNetwork(!showAddNetwork)}
              >
                <Globe className="h-4 w-4 mr-2" />
                Add Network
              </Button>
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
          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-destructive/70 hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Network Printer Form */}
          <AnimatePresence>
            {showAddNetwork && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4" />
                    Add Network Printer
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="printer-name" className="text-xs">
                        Printer Name *
                      </Label>
                      <Input
                        id="printer-name"
                        placeholder="Office Printer"
                        value={networkForm.name}
                        onChange={(e) => setNetworkForm(f => ({ ...f, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="printer-ip" className="text-xs">
                        IP Address *
                      </Label>
                      <Input
                        id="printer-ip"
                        placeholder="192.168.1.100"
                        value={networkForm.ipAddress}
                        onChange={(e) => setNetworkForm(f => ({ ...f, ipAddress: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="printer-model" className="text-xs">
                      Model (optional)
                    </Label>
                    <Input
                      id="printer-model"
                      placeholder="DNP DS620A"
                      value={networkForm.model}
                      onChange={(e) => setNetworkForm(f => ({ ...f, model: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddNetworkPrinter}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Printer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAddNetwork(false);
                        setNetworkForm({ name: '', ipAddress: '', model: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scanning State */}
          {isScanning && printers.length === 0 && (
            <div className="text-center py-8">
              <RefreshCw className="h-10 w-10 mx-auto mb-3 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Scanning for printers...</p>
            </div>
          )}

          {/* No Printers Found */}
          {!isScanning && printers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Printer className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No printers found</p>
              <p className="text-xs mt-1">
                Click "Add USB" or "Add Network" to connect a printer
              </p>
            </div>
          )}

          {/* Printer List */}
          {printers.length > 0 && (
            <div className="space-y-4">
              {/* USB Printers */}
              {groupedPrinters.usb.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Usb className="h-3.5 w-3.5" />
                    USB Printers
                  </div>
                  <div className="space-y-2">
                    {groupedPrinters.usb.map((printer) => (
                      <PrinterCard
                        key={printer.id}
                        printer={printer}
                        isSelected={config.selectedPrinterId === printer.id}
                        onSelect={() => selectPrinter(printer)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Network Printers */}
              {groupedPrinters.network.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Wifi className="h-3.5 w-3.5" />
                    Network / Wireless Printers
                  </div>
                  <div className="space-y-2">
                    {groupedPrinters.network.map((printer) => (
                      <PrinterCard
                        key={printer.id}
                        printer={printer}
                        isSelected={config.selectedPrinterId === printer.id}
                        onSelect={() => selectPrinter(printer)}
                        onRemove={
                          printer.connectionType === 'network'
                            ? () => handleRemoveNetworkPrinter(printer.id)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* System Printer */}
              {groupedPrinters.system.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Monitor className="h-3.5 w-3.5" />
                    System Printer
                  </div>
                  <div className="space-y-2">
                    {groupedPrinters.system.map((printer) => (
                      <PrinterCard
                        key={printer.id}
                        printer={printer}
                        isSelected={config.selectedPrinterId === printer.id}
                        onSelect={() => selectPrinter(printer)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printer Settings (when selected) */}
      <AnimatePresence>
        {selectedPrinter && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <CardTitle className="text-base">Printer Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedPrinter.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p className="font-medium">{selectedPrinter.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Connection:</span>
                    <p className="font-medium">{formatConnectionType(selectedPrinter.connectionType)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium flex items-center gap-1.5">
                      <StatusIcon status={selectedPrinter.status} />
                      {formatPrinterStatus(selectedPrinter.status).label}
                    </p>
                  </div>
                  {selectedPrinter.ipAddress && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">IP Address:</span>
                      <p className="font-medium font-mono">{selectedPrinter.ipAddress}</p>
                    </div>
                  )}
                </div>

                {/* Capabilities */}
                {selectedPrinter.capabilities && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPrinter.capabilities.colorSupport && (
                        <Badge variant="outline">Color</Badge>
                      )}
                      {selectedPrinter.capabilities.duplexSupport && (
                        <Badge variant="outline">Duplex</Badge>
                      )}
                      {selectedPrinter.capabilities.borderless && (
                        <Badge variant="outline">Borderless</Badge>
                      )}
                      <Badge variant="outline">{selectedPrinter.capabilities.maxResolution}</Badge>
                    </div>
                    {selectedPrinter.capabilities.paperSizes.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Paper sizes: {selectedPrinter.capabilities.paperSizes.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* System printer info */}
                {selectedPrinter.connectionType === 'system' && (
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-400">
                        System Print Dialog
                      </p>
                      <p className="text-blue-600 dark:text-blue-300 mt-1">
                        Printing will open your system's print dialog where you can select any
                        installed printer and adjust settings.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Section */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowHelp(!showHelp)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Printer Setup Help
            </CardTitle>
            {showHelp ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="pt-0">
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
                      <Usb className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">USB Printers (Recommended)</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Click "Add USB" and select your printer</li>
                        <li>Direct printing without dialogs</li>
                        <li>Supported: DNP, HiTi, Canon, Epson, Brother, Kodak, Mitsubishi</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg h-fit">
                      <Wifi className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Network / Wi-Fi Printers</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Click "Add Network" and enter the printer's IP address</li>
                        <li>Works with AirPrint-compatible printers</li>
                        <li>Printer must be on the same network</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="p-2 bg-gray-500/10 rounded-lg h-fit">
                      <Monitor className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">System Printer (Fallback)</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Works with any printer installed on your device</li>
                        <li>Opens system print dialog for each print</li>
                        <li>Available on laptops, tablets, and iPads</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium text-foreground mb-1">Troubleshooting</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Make sure the printer is powered on and connected</li>
                      <li>For USB: Use Chrome or Edge browser for best support</li>
                      <li>For Network: Ensure printer is on the same Wi-Fi network</li>
                      <li>Try clicking "Refresh" to re-scan for printers</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

// Printer Card Component
function PrinterCard({
  printer,
  isSelected,
  onSelect,
  onRemove,
}: {
  printer: DiscoveredPrinter;
  isSelected: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  const statusInfo = formatPrinterStatus(printer.status);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      )}
      onClick={onSelect}
    >
      {/* Connection Type Icon */}
      <div
        className={cn(
          'p-2.5 rounded-xl',
          printer.connectionType === 'usb' && 'bg-blue-500/10 text-blue-500',
          printer.connectionType === 'network' && 'bg-purple-500/10 text-purple-500',
          printer.connectionType === 'airprint' && 'bg-indigo-500/10 text-indigo-500',
          printer.connectionType === 'bluetooth' && 'bg-cyan-500/10 text-cyan-500',
          printer.connectionType === 'system' && 'bg-gray-500/10 text-gray-500'
        )}
      >
        <ConnectionIcon type={printer.connectionType} />
      </div>

      {/* Printer Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{printer.name}</p>
          {isSelected && (
            <Badge variant="default" className="bg-primary text-[10px] px-1.5 py-0">
              Selected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">
            {printer.model}
          </p>
          {printer.ipAddress && (
            <span className="text-xs text-muted-foreground font-mono">
              • {printer.ipAddress}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full', statusInfo.bgColor)}>
          <StatusIcon status={printer.status} />
          <span className={cn('text-xs font-medium', statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>

        {/* Remove button for network printers */}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
