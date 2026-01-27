'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PrinterConfig } from '@/types';
import { detectPrinters, getDefaultPrinter, isWebUSBSupported, connectUSBPrinter } from '@/lib/printing/thermal';
import { connectPrinter, getConnectionStatus, disconnectPrinter } from '@/lib/printing/connection';
import { scaleFadeVariants } from '@/components/animations/variants';
import { Printer, Wifi, Usb, Globe, Check, AlertCircle, RefreshCw, Plus } from 'lucide-react';

interface PrinterSetupProps {
  selectedPrinter: PrinterConfig | null;
  onSelectPrinter: (printer: PrinterConfig) => void;
  className?: string;
}

export function PrinterSetup({
  selectedPrinter,
  onSelectPrinter,
  className,
}: PrinterSetupProps) {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrinters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const detected = await detectPrinters();
      setPrinters(detected);

      // Auto-select browser print if nothing selected
      if (!selectedPrinter && detected.length > 0) {
        onSelectPrinter(detected[0]);
      }
    } catch (err) {
      setError('Failed to detect printers');
      setPrinters([getDefaultPrinter()]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, []);

  const handleAddUSBPrinter = async () => {
    if (!isWebUSBSupported()) {
      setError('WebUSB is not supported in this browser');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const device = await connectUSBPrinter();
      if (device) {
        const printer: PrinterConfig = {
          id: `usb-${device.serialNumber || device.productId}`,
          name: device.productName || 'USB Thermal Printer',
          type: 'thermal',
          connectionType: 'usb',
        };
        setPrinters((prev) => [...prev.filter((p) => p.id !== printer.id), printer]);
        onSelectPrinter(printer);
      }
    } catch (err) {
      setError('Failed to connect USB printer');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectPrinter = async (printer: PrinterConfig) => {
    setIsConnecting(true);
    setError(null);

    try {
      const connection = await connectPrinter(printer);
      if (connection.status === 'connected') {
        onSelectPrinter(printer);
      } else {
        setError(connection.error || 'Failed to connect');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const getIcon = (printer: PrinterConfig) => {
    switch (printer.connectionType) {
      case 'usb':
        return <Usb className="w-5 h-5" />;
      case 'network':
        return <Wifi className="w-5 h-5" />;
      case 'browser':
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (printer: PrinterConfig) => {
    if (selectedPrinter?.id === printer.id) {
      return <Check className="w-5 h-5 text-green-400" />;
    }
    const status = getConnectionStatus(printer.id);
    if (status === 'error') {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
    return null;
  };

  return (
    <motion.div
      variants={scaleFadeVariants}
      initial="initial"
      animate="animate"
      className={cn('flex flex-col gap-4', className)}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Select Printer
        </label>
        <button
          onClick={loadPrinters}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs text-zinc-400',
            'hover:text-white transition-colors',
            'disabled:opacity-50'
          )}
        >
          <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Printer list */}
      <div className="flex flex-col gap-2">
        {printers.map((printer) => (
          <button
            key={printer.id}
            onClick={() => handleSelectPrinter(printer)}
            disabled={isConnecting}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              'border-2 transition-all text-left',
              selectedPrinter?.id === printer.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50',
              'disabled:opacity-50'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                selectedPrinter?.id === printer.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-zinc-800 text-zinc-400'
              )}
            >
              {getIcon(printer)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">{printer.name}</div>
              <div className="text-xs text-zinc-500 capitalize">
                {printer.connectionType} • {printer.type}
              </div>
            </div>

            {getStatusIcon(printer)}
          </button>
        ))}
      </div>

      {/* Add USB Printer */}
      {isWebUSBSupported() && (
        <button
          onClick={handleAddUSBPrinter}
          disabled={isConnecting}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg',
            'border-2 border-dashed border-zinc-700',
            'hover:border-zinc-500 hover:bg-zinc-800/50 transition-all',
            'disabled:opacity-50'
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Plus className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-zinc-300">Add USB Printer</div>
            <div className="text-xs text-zinc-500">Connect thermal printer via USB</div>
          </div>
        </button>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Connection status */}
      {selectedPrinter && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            Connected to {selectedPrinter.name}
          </p>
        </div>
      )}
    </motion.div>
  );
}
