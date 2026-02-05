/**
 * Printing Module
 *
 * Unified print layout system for the photobooth app.
 *
 * PAPER SIZE STANDARDS (300 DPI):
 * - All output uses 4R (4x6 inches) = 1200 x 1800 px
 * - 20px safe margin on each side
 *
 * LAYOUT MODES:
 * - Strip: 2 identical strips side-by-side on 4R canvas
 * - 4R: Single photo/layout fills the 4R canvas
 */

// Print composition and formatting
export {
  composeForPrint,
  getPrintBlob,
  getPrintDataUrl,
  getPrintFormat,
  getPrintSpecs,
  calculatePreviewDimensions,
  validateBoxes,
  PRINT_FORMATS,
  type ComposeForPrintOptions,
} from './formats';

// Printer connections and thermal printing
export {
  print,
  browserPrint,
  networkPrint,
  isWebUSBSupported,
  connectUSBPrinter,
  getDefaultPrinter,
  detectPrinters,
} from './thermal';

// Connection management
export {
  connectPrinter,
  disconnectPrinter,
  getConnectionStatus,
  getActiveConnections,
  isPrinterReady,
} from './connection';

// Advanced print composer (alternative API)
export {
  composePrint,
  composePrintDataUrl,
  composePrintBlob,
  composePreview,
  validateLayout,
  getPrintSpecs as getAdvancedPrintSpecs,
  PRINT_CANVAS,
  SAFE_MARGIN,
  STRIP_GAP,
  STRIP_DIMENSIONS,
  PHOTO_4R_DIMENSIONS,
} from './print-composer';

// Printer discovery and management
export {
  discoverAllPrinters,
  scanUsbPrinters,
  scanNetworkPrinters,
  requestUsbPrinter,
  addNetworkPrinter,
  removeNetworkPrinter,
  subscribeToPrinterUpdates,
  setupUsbListeners,
  startStatusPolling,
  stopStatusPolling,
  checkPrinterStatus,
  isWebUsbSupported,
  formatPrinterStatus,
  formatConnectionType,
  getConnectionTypeIcon,
  getPrinterById,
  getAllPrinters,
  getSystemPrinter,
  SUPPORTED_USB_VENDORS,
  type DiscoveredPrinter,
  type PrinterCapabilities,
} from './printer-discovery';
