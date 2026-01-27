'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Camera, Sparkles, Printer, Download, Palette, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainerVariants, staggerChildVariants, fadeVariants } from '@/components/animations/variants';

const features = [
  {
    icon: <Camera className="w-6 h-6" />,
    title: 'Multiple Camera Sources',
    description: 'Webcam, HDMI capture, USB tethering, or WiFi transfer',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Filters & Effects',
    description: 'Apply B&W, vintage, high contrast, and more',
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: 'Custom Themes',
    description: 'Wedding, party, corporate presets or create your own',
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: 'Easy Export',
    description: 'Download as PNG/JPEG or share via QR code',
  },
  {
    icon: <Printer className="w-6 h-6" />,
    title: 'Print Support',
    description: 'Direct thermal printer support with 2x6 and 4x6 sizes',
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: 'Fully Responsive',
    description: 'Works on mobile, tablet, and desktop',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <motion.section
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        className="relative overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30"
            >
              <Camera className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              Photobooth
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-xl text-zinc-400 max-w-2xl mx-auto"
            >
              Create stunning photo strips with filters, themes, and effects.
              Perfect for weddings, parties, and events.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/booth"
                className={cn(
                  'inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg',
                  'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
                  'hover:from-blue-700 hover:to-purple-700 transition-all',
                  'shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                )}
              >
                <Camera className="w-5 h-5" />
                Start Photobooth
              </Link>

              <span className="text-zinc-500">No signup required</span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold">Everything You Need</h2>
            <p className="mt-4 text-zinc-400">
              A complete photobooth solution in your browser
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={staggerChildVariants}
                className={cn(
                  'p-6 rounded-xl',
                  'bg-zinc-800/50 border border-zinc-700/50',
                  'hover:bg-zinc-800 hover:border-zinc-600 transition-colors'
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Create Memorable Photo Strips
              </h2>
              <p className="text-zinc-400 mb-6">
                Take 3 or 4 photos with customizable countdown timer, apply beautiful
                filters, choose from preset themes or create your own, and export
                high-quality images ready for printing.
              </p>
              <ul className="space-y-3">
                {[
                  'User-selectable 3 or 4 photos per strip',
                  'Countdown timer: 3, 5, 8, or 10 seconds',
                  'Wedding, Party, Corporate themes',
                  'Custom theme builder with colors and fonts',
                  'Print sizes: 2x6 strip or 4x6 photo',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              {/* Mock photo strip preview */}
              <div className="bg-zinc-800 rounded-xl p-4 shadow-2xl max-w-[200px] mx-auto">
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] bg-zinc-700 rounded-md flex items-center justify-center"
                    >
                      <Camera className="w-8 h-8 text-zinc-500" />
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-zinc-500 mt-3">
                  Sample Photo Strip
                </p>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-zinc-400 mb-8">
            Launch the photobooth now and create your first photo strip in seconds.
          </p>
          <Link
            href="/booth"
            className={cn(
              'inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg',
              'bg-white text-zinc-900',
              'hover:bg-zinc-100 transition-colors',
              'shadow-lg'
            )}
          >
            <Camera className="w-5 h-5" />
            Launch Photobooth
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 text-center text-zinc-500 text-sm">
          <p>Photobooth Web App</p>
          <p className="mt-2">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
