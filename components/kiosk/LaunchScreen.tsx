'use client';

import { motion } from 'framer-motion';
import type { LaunchPageConfig, DraggableElement } from '@/lib/events/types';

interface LaunchScreenProps {
  config: LaunchPageConfig;
  eventName: string;
  onStart: () => void;
}

export function LaunchScreen({ config, eventName, onStart }: LaunchScreenProps) {
  const renderElement = (element: DraggableElement) => {
    if (!element.visible) return null;

    // Base positioning style - use x/y for Framer Motion transforms to avoid conflicts
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}%`,
      top: `${element.y}%`,
      width: `${element.width}%`,
      height: `${element.height}%`,
      transformOrigin: 'center center',
      zIndex: element.zIndex,
    };

    // Use Framer Motion's x/y for centering transform to avoid style conflicts
    const centerTransform = {
      x: '-50%',
      y: '-50%',
      rotate: element.rotation,
    };

    switch (element.type) {
      case 'text':
        return (
          <motion.div
            key={element.id}
            style={baseStyle}
            initial={{ opacity: 0, ...centerTransform }}
            animate={{ opacity: 1, ...centerTransform }}
            transition={{ delay: element.zIndex * 0.1 }}
            className="flex items-center justify-center"
          >
            <p
              style={{
                fontSize: `${element.properties.fontSize || 24}px`,
                fontFamily: element.properties.fontFamily || 'Inter',
                fontWeight: element.properties.fontWeight || 'normal',
                textAlign: element.properties.textAlign || 'center',
                color: element.properties.color || '#ffffff',
                width: '100%',
              }}
            >
              {element.properties.text || 'Text'}
            </p>
          </motion.div>
        );

      case 'logo':
      case 'image':
        return (
          <motion.div
            key={element.id}
            style={baseStyle}
            initial={{ opacity: 0, scale: 0.8, ...centerTransform }}
            animate={{ opacity: 1, scale: 1, ...centerTransform }}
            transition={{ delay: element.zIndex * 0.1 }}
          >
            {element.properties.src ? (
              <img
                src={element.properties.src}
                alt={element.type}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: element.properties.objectFit || 'contain',
                  borderRadius: `${element.properties.borderRadius || 0}px`,
                  opacity: element.properties.opacity ?? 1,
                }}
              />
            ) : (
              <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white/50 text-sm">
                  {element.type === 'logo' ? 'Logo' : 'Image'}
                </span>
              </div>
            )}
          </motion.div>
        );

      case 'button':
        return (
          <motion.div
            key={element.id}
            style={baseStyle}
            initial={{ opacity: 0, scale: 0.9, ...centerTransform }}
            animate={{ opacity: 1, scale: 1, ...centerTransform }}
            transition={{ delay: element.zIndex * 0.1 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: element.properties.buttonColor || '#3b82f6',
                color: element.properties.buttonTextColor || '#ffffff',
                borderRadius: `${element.properties.buttonBorderRadius || 8}px`,
                fontSize: '1.125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {element.properties.buttonText || 'Start'}
            </motion.button>
          </motion.div>
        );

      case 'shape':
        const shapeStyle: React.CSSProperties = {
          ...baseStyle,
          backgroundColor: element.properties.fill || 'transparent',
          border: element.properties.stroke
            ? `${element.properties.strokeWidth || 2}px solid ${element.properties.stroke}`
            : 'none',
        };

        if (element.properties.shapeType === 'circle') {
          shapeStyle.borderRadius = '50%';
        }

        return (
          <motion.div
            key={element.id}
            style={shapeStyle}
            initial={{ opacity: 0, ...centerTransform }}
            animate={{ opacity: 1, ...centerTransform }}
            transition={{ delay: element.zIndex * 0.1 }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundColor: config.backgroundColor,
      }}
    >
      {/* Background Image */}
      {config.backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${config.backgroundImage})`,
            opacity: config.backgroundOpacity / 100,
          }}
        />
      )}

      {/* Elements Container - fills entire screen */}
      <div className="absolute inset-0">
        {config.elements.map(renderElement)}
      </div>

      {/* Click anywhere hint for touch screens */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <p className="text-white/50 text-sm">Tap the button to begin</p>
      </motion.div>
    </div>
  );
}
