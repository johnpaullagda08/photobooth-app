'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import Link from 'next/link';
import { Camera, Sparkles, Printer, Download, Layout, Smartphone, ArrowRight, Play, Mail, Facebook, User, Settings, Image, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

// Animated text that reveals character by character
function AnimatedText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <motion.span className={cn('inline-block', className)}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + index * 0.03,
            ease: [0.215, 0.61, 0.355, 1],
          }}
          className="inline-block"
          style={{ transformOrigin: 'bottom' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Magnetic button effect
function MagneticButton({ children, className, href }: { children: React.ReactNode; className?: string; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    const x = (clientX - left - width / 2) * 0.3;
    const y = (clientY - top - height / 2) * 0.3;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const springX = useSpring(position.x, springConfig);
  const springY = useSpring(position.y, springConfig);

  useEffect(() => {
    springX.set(position.x);
    springY.set(position.y);
  }, [position, springX, springY]);

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

// Floating orb component
function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={cn('absolute rounded-full blur-3xl', className)}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Feature card with hover effect
function FeatureCard({ icon, title, description, index }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.215, 0.61, 0.355, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative p-8 rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/[0.08] backdrop-blur-sm hover:border-rose-500/30 transition-colors duration-500"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-rose-100 transition-colors">{title}</h3>
        <p className="text-neutral-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

const features = [
  {
    icon: <Settings className="w-6 h-6" />,
    title: 'Event Management',
    description: 'Create and manage multiple events with unique settings, layouts, and configurations for each occasion.',
  },
  {
    icon: <Camera className="w-6 h-6" />,
    title: 'Multi-Camera Support',
    description: 'Connect webcams, DSLR/mirrorless cameras via HDMI capture, USB tethering, or WiFi transfer.',
  },
  {
    icon: <Layout className="w-6 h-6" />,
    title: 'Print Layout Editor',
    description: 'Design custom layouts with drag-and-drop positioning. Choose 2x6 strips or 4x6 (4R) paper sizes.',
  },
  {
    icon: <Image className="w-6 h-6" />,
    title: 'Template Backgrounds',
    description: 'Upload custom backgrounds and frame overlays. Save templates for quick reuse across events.',
  },
  {
    icon: <Printer className="w-6 h-6" />,
    title: 'Instant Printing',
    description: 'Print directly to thermal printers with professional quality. Download photos as high-res images.',
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: 'Mobile Friendly',
    description: 'Fully responsive design works on tablets, iPads, and phones. Perfect for on-the-go events.',
  },
];

export default function HomePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Animated background orbs */}
        <FloatingOrb className="w-[600px] h-[600px] bg-rose-500/20 -top-40 -left-40" delay={0} />
        <FloatingOrb className="w-[500px] h-[500px] bg-orange-500/15 top-1/2 -right-40" delay={2} />
        <FloatingOrb className="w-[400px] h-[400px] bg-pink-500/10 bottom-0 left-1/3" delay={4} />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
          }}
        />

        <motion.div style={{ y, opacity }} className="relative z-10 max-w-6xl mx-auto px-6 py-32">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.1] mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm text-neutral-300">Free to use, no signup required</span>
            </motion.div>

            {/* Main headline with character animation */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8">
              <AnimatedText text="Log the" className="block" delay={0.2} />
              <span className="block mt-2">
                <AnimatedText text="Photo" className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-orange-400 to-rose-400" delay={0.5} />
                <AnimatedText text="booth" className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400" delay={0.75} />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="text-xl sm:text-2xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Create professional photo strips for weddings, parties, and events.
              Easy event setup, live camera preview, and instant printing.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <MagneticButton
                href="/booth"
                className={cn(
                  'group inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-lg',
                  'bg-gradient-to-r from-rose-500 to-orange-500 text-white',
                  'hover:shadow-[0_0_40px_rgba(244,63,94,0.4)] transition-shadow duration-300'
                )}
              >
                <Play className="w-5 h-5" />
                Start Photobooth
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>

              <Link
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg border border-white/20 hover:bg-white/5 transition-colors"
              >
                Explore Features
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <motion.div className="w-1 h-2 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <span className="text-rose-400 text-sm font-semibold tracking-wider uppercase mb-4 block">Features</span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              A complete photobooth solution that runs entirely in your browser
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 relative">
        <FloatingOrb className="w-[500px] h-[500px] bg-rose-500/10 -right-60 top-0" delay={1} />

        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-rose-400 text-sm font-semibold tracking-wider uppercase mb-4 block">How It Works</span>
              <h2 className="text-4xl sm:text-5xl font-bold mb-8 leading-tight">
                Simple Workflow,
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400"> Professional Results</span>
              </h2>
              <p className="text-xl text-neutral-400 mb-10 leading-relaxed">
                Set up your event in minutes, capture photos with live preview,
                and print or download instantly. Perfect for any occasion.
              </p>

              <ul className="space-y-4">
                {[
                  'Create events with custom settings and layouts',
                  'Choose paper size: 2x6 strips or 4x6 (4R) photos',
                  'Connect any camera: webcam, DSLR, or mirrorless',
                  'Capture with countdown timer (3, 5, 8, or 10 seconds)',
                  'Preview photos and print or download instantly',
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500" />
                    <span className="text-neutral-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Photo strip mockup */}
              <div className="relative mx-auto max-w-[280px]">
                <motion.div
                  className="bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl p-6 shadow-2xl"
                  whileHover={{ rotate: 2, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 }}
                        className="aspect-[4/3] bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-lg flex items-center justify-center overflow-hidden"
                      >
                        <Camera className="w-10 h-10 text-neutral-500" />
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-700">
                    <p className="text-center text-sm text-neutral-400">Your Event Name</p>
                    <p className="text-center text-xs text-neutral-500 mt-1">Log the Photobooth</p>
                  </div>
                </motion.div>

                {/* Decorative elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-3xl blur-2xl -z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-rose-400 text-sm font-semibold tracking-wider uppercase mb-4 block">About</span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-8">
              What is Log the Photobooth?
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="prose prose-lg prose-invert mx-auto"
          >
            <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.08] rounded-2xl p-8 sm:p-12">
              <p className="text-neutral-300 text-lg leading-relaxed mb-6">
                <strong className="text-white">Log the Photobooth</strong> is a modern, browser-based photobooth application
                designed for events of all sizes. Whether you're hosting a wedding, birthday party, corporate event,
                or any special occasion, our platform makes it easy to capture and print memorable photos.
              </p>
              <p className="text-neutral-300 text-lg leading-relaxed mb-6">
                The application features a powerful event management system where you can create multiple events,
                each with its own unique settings. Configure your preferred paper size (2x6 photo strips or 4x6 4R photos),
                connect any camera source, and customize your print layouts with backgrounds and frame overlays.
              </p>
              <p className="text-neutral-300 text-lg leading-relaxed mb-6">
                With support for webcams, DSLR cameras via HDMI capture cards, mirrorless cameras via USB,
                and WiFi camera transfer, you have the flexibility to use professional equipment or simple
                built-in cameras. The live preview ensures every shot is perfect before printing.
              </p>
              <p className="text-neutral-400 text-base">
                Built with modern web technologies and designed to be responsive on all devices including
                tablets and mobile phones. No installation required - just open your browser and start capturing memories.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/5 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-6 text-center relative z-10"
        >
          <h2 className="text-4xl sm:text-6xl font-bold mb-8">
            Ready to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400"> Get Started?</span>
          </h2>
          <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto">
            Launch Log the Photobooth now and create your first event in seconds.
            No downloads, no signup - just open and start capturing memories.
          </p>

          <MagneticButton
            href="/booth"
            className={cn(
              'group inline-flex items-center gap-3 px-10 py-5 rounded-full font-semibold text-xl',
              'bg-white text-neutral-900',
              'hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-shadow duration-300'
            )}
          >
            <Camera className="w-6 h-6" />
            Launch Photobooth
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </MagneticButton>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-rose-400 text-sm font-semibold tracking-wider uppercase mb-4 block">Contact</span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Have questions, feedback, or need support? Feel free to reach out.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <a
              href="mailto:johnpaullagda08@gmail.com"
              className="group flex items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/[0.08] hover:border-rose-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-left">
                <p className="text-sm text-neutral-400">Email</p>
                <p className="text-white font-medium">johnpaullagda08@gmail.com</p>
              </div>
            </a>

            <a
              href="https://www.facebook.com/johnpaullagda08/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/[0.08] hover:border-rose-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Facebook className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-left">
                <p className="text-sm text-neutral-400">Facebook</p>
                <p className="text-white font-medium">John Paul Lagda</p>
              </div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center gap-8">
            {/* Logo and name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl block">Log the Photobooth</span>
                <span className="text-neutral-500 text-sm">Event Photo Strip Creator</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8 text-sm">
              <Link href="#features" className="text-neutral-400 hover:text-white transition-colors">Features</Link>
              <Link href="#about" className="text-neutral-400 hover:text-white transition-colors">About</Link>
              <Link href="#contact" className="text-neutral-400 hover:text-white transition-colors">Contact</Link>
              <Link href="/booth" className="text-neutral-400 hover:text-white transition-colors">Launch App</Link>
            </div>

            {/* Developer info */}
            <div className="flex flex-col items-center gap-2 pt-4 border-t border-white/[0.05] w-full">
              <div className="flex items-center gap-2 text-neutral-400">
                <User className="w-4 h-4" />
                <span className="text-sm">Developed by <span className="text-white">John Paul Lagda</span></span>
              </div>
              <p className="text-neutral-500 text-sm">
                Built with Next.js, TypeScript, and Tailwind CSS
              </p>
              <p className="text-neutral-600 text-xs mt-2">
                &copy; {new Date().getFullYear()} Log the Photobooth. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
