import React, { useState, useEffect } from 'react';
import { ChevronRight, QrCode, Smartphone, Sparkles, ArrowRight, ShieldCheck, Wine } from 'lucide-react';
import logoImg from '../assets/images/rios_pos_logo_1789649347478.jpg';

interface WelcomeSliderProps {
  onContinue: () => void;
}

interface SlideItem {
  tag: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: string;
}

export const WelcomeSlider: React.FC<WelcomeSliderProps> = ({ onContinue }) => {
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const slides: SlideItem[] = [
    {
      tag: "Point of Sale & Hospitality",
      title: "Rios POS",
      subtitle: "The complete real-time operating system for modern bars, lounges, and restaurants.",
      icon: <Wine className="w-8 h-8 text-black" />,
      badge: "Real-Time Sync",
    },
    {
      tag: "Smart Table QR Service",
      title: "Direct Table Ordering",
      subtitle: "Assign Table 1, Table 2, Table 3 with individual QR codes. Patrons scan to order drinks straight to your waiters.",
      icon: <QrCode className="w-8 h-8 text-black" />,
      badge: "Self-Ordering",
    },
    {
      tag: "Multi-Device Ecosystem",
      title: "Laptop & Phone Unified",
      subtitle: "Log in with your Google Account on any device. Your inventory, employees, and sales remain synchronized everywhere.",
      icon: <Smartphone className="w-8 h-8 text-black" />,
      badge: "Cross-Device Cloud",
    },
  ];

  // Auto-slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div
      id="welcome-slider-screen"
      onClick={onContinue}
      className="min-h-screen bg-[#0d0f12] text-white flex flex-col justify-between items-center px-4 py-8 sm:py-12 cursor-pointer select-none relative overflow-hidden"
    >
      {/* Ambient background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/[0.04] rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar with Rio's POS Badge */}
      <div className="w-full max-w-xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
            System Live & Ready
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multi-Tenant Cloud</span>
        </div>
      </div>

      {/* Main Slider Content */}
      <div className="w-full max-w-xl flex flex-col items-center text-center my-auto z-10">
        {/* Brand Logo */}
        <div className="mb-6 relative">
          <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-white/20 max-w-[280px] sm:max-w-[340px] transform hover:scale-[1.02] transition-transform">
            <img
              src={logoImg}
              alt="Rios POS"
              className="w-full h-auto object-contain drop-shadow-sm"
            />
          </div>
        </div>

        {/* Dynamic Slide View */}
        <div className="min-h-[160px] flex flex-col items-center justify-center px-4 transition-all duration-300">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400/90 mb-2 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
            {slides[activeSlide].tag}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            {slides[activeSlide].title}
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
            {slides[activeSlide].subtitle}
          </p>
        </div>

        {/* Slide Indicators / Dots */}
        <div className="flex items-center gap-2.5 mt-8 mb-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/25 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom "Tap to Continue" Prompt */}
      <div className="w-full max-w-xl flex flex-col items-center z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          id="tap-to-continue-btn"
          className="w-full sm:w-auto px-8 py-4 bg-white text-black font-extrabold text-sm sm:text-base rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-lg shadow-white/10 active:scale-98 animate-bounce cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
          <span>Tap to Continue</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-[11px] text-gray-500 mt-3 font-medium tracking-wide">
          Tap anywhere on screen to sign in with Google
        </p>
      </div>
    </div>
  );
};
