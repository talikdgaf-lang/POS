import React from 'react';
import { motion } from 'motion/react';
import logoImg from '../assets/images/rios_pos_logo_1789649347478.jpg';

interface BrandSplashIntroProps {
  onContinue: () => void;
}

export const BrandSplashIntro: React.FC<BrandSplashIntroProps> = ({ onContinue }) => {
  return (
    <div
      id="brand-splash-screen"
      role="button"
      tabIndex={0}
      onClick={onContinue}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onContinue();
        }
      }}
      className="min-h-screen w-full bg-white text-black flex flex-col justify-between items-center px-4 py-8 sm:py-12 select-none cursor-pointer overflow-hidden relative outline-none"
    >
      {/* Top Section: Exact Brand Logo Image */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full flex justify-center pt-6 sm:pt-12 md:pt-16 px-4"
      >
        <img
          src={logoImg}
          alt="Rio's POS - EST 2026"
          className="w-full max-w-[280px] sm:max-w-[380px] md:max-w-[440px] object-contain drop-shadow-none pointer-events-none"
        />
      </motion.div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Section: Simple, small written words saying "tap to continue" with minimalist orange dot */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="pb-6 sm:pb-10 md:pb-12 flex flex-col items-center gap-2"
      >
        <motion.p
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-xs sm:text-sm font-normal text-neutral-500 tracking-widest lowercase"
        >
          tap to continue
        </motion.p>
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
      </motion.div>
    </div>
  );
};
