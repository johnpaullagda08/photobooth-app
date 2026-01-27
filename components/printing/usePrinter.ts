'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PrinterConfig, PrintSize } from '@/types';
import { detectPrinters, getDefaultPrinter, print, isPrintingAvailable } from '@/lib/printing/thermal';
import { connectPrinter, disconnectPrinter, isPrinterReady } from '@/lib/printing/connection';

interface UsePrinterReturn {
  printers: PrinterConfig[];
  selectedPrinter: PrinterConfig | null;
  printSize: PrintSize;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isPrintingAvailable: boolean;
  selectPrinter: (printer: PrinterConfig) => Promise<void>;
  setPrintSize: (size: PrintSize) => void;
  refreshPrinters: () => Promise<void>;
  printImage: (imageData: string) => Promise<boolean>;
}

export function usePrinter(): UsePrinterReturn {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterConfig | null>(null);
  const [printSize, setPrintSize] = useState<PrintSize>('2x6');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPrinters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const detected = await detectPrinters();
      setPrinters(detected);

      // Auto-select default printer if none selected
      if (!selectedPrinter && detected.length > 0) {
        const defaultPrinter = detected.find((p) => p.connectionType === 'browser') || detected[0];
        setSelectedPrinter(defaultPrinter);
        setIsConnected(true);
      }
    } catch (err) {
      setError((err as Error).message);
      // Fallback to browser print
      const defaultPrinter = getDefaultPrinter();
      setPrinters([defaultPrinter]);
      setSelectedPrinter(defaultPrinter);
      setIsConnected(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPrinter]);

  const selectPrinter = useCallback(async (printer: PrinterConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      // Disconnect from previous printer
      if (selectedPrinter && selectedPrinter.id !== printer.id) {
        await disconnectPrinter(selectedPrinter.id);
      }

      // Connect to new printer
      const connection = await connectPrinter(printer);

      if (connection.status === 'connected') {
        setSelectedPrinter(printer);
        setIsConnected(true);
      } else {
        throw new Error(connection.error || 'Connection failed');
      }
    } catch (err) {
      setError((err as Error).message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPrinter]);

  const printImage = useCallback(async (imageData: string): Promise<boolean> => {
    if (!selectedPrinter) {
      setError('No printer selected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const job = await print(imageData, selectedPrinter);

      if (job.status === 'complete') {
        return true;
      } else {
        throw new Error(job.error || 'Print failed');
      }
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedPrinter]);

  // Initial load
  useEffect(() => {
    refreshPrinters();
  }, []);

  // Check connection status periodically
  useEffect(() => {
    if (selectedPrinter) {
      const interval = setInterval(() => {
        setIsConnected(isPrinterReady(selectedPrinter.id));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedPrinter]);

  return {
    printers,
    selectedPrinter,
    printSize,
    isConnected,
    isLoading,
    error,
    isPrintingAvailable: isPrintingAvailable(),
    selectPrinter,
    setPrintSize,
    refreshPrinters,
    printImage,
  };
}
