'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { scaleFadeVariants } from '@/components/animations/variants';
import { QrCode, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  title?: string;
  className?: string;
}

export function QRCodeDisplay({
  value,
  size = 200,
  title = 'Scan to download',
  className,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Don't render if value is too long (data URLs are too long for QR codes)
  if (value.length > 2000 || value.startsWith('data:')) {
    return (
      <motion.div
        variants={scaleFadeVariants}
        initial="initial"
        animate="animate"
        className={cn(
          'flex flex-col items-center gap-4 p-6 bg-zinc-800 rounded-xl',
          className
        )}
      >
        <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
          <QrCode className="w-6 h-6 text-zinc-400" />
        </div>
        <p className="text-sm text-zinc-400 text-center">
          QR code not available for local images.
          <br />
          Upload to a server to generate a QR code.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={scaleFadeVariants}
      initial="initial"
      animate="animate"
      className={cn(
        'flex flex-col items-center gap-4 p-6 bg-zinc-800 rounded-xl',
        className
      )}
    >
      {/* Title */}
      <h3 className="text-lg font-semibold text-white">{title}</h3>

      {/* QR Code */}
      <div className="p-4 bg-white rounded-lg">
        <QRCode
          value={value}
          size={size}
          level="M"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={handleCopyLink}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-4',
            'bg-zinc-700 text-white rounded-lg',
            'hover:bg-zinc-600 transition-colors'
          )}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center justify-center gap-2 py-2 px-4',
            'bg-zinc-700 text-white rounded-lg',
            'hover:bg-zinc-600 transition-colors'
          )}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open</span>
        </a>
      </div>

      {/* URL preview */}
      <p className="text-xs text-zinc-500 truncate max-w-full px-2">
        {value.length > 50 ? `${value.slice(0, 50)}...` : value}
      </p>
    </motion.div>
  );
}
