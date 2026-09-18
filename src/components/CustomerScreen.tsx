import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface CustomerScreenProps {
  onOrderNow: () => void;
  onBack: () => void;
  table?: string;
}

export const CustomerScreen: React.FC<CustomerScreenProps> = ({ onOrderNow, onBack }) => {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between items-center p-6 select-none relative">
      {/* Back button */}
      <div className="w-full max-w-lg flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-black transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center w-full max-w-md text-center py-12">
        <div className="flex items-center gap-1.5 mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black">
            Are you ordering now?
          </h1>
          <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
        </div>
        <p className="text-xs text-neutral-500 mb-8 max-w-xs leading-relaxed">
          Select your bar and table to place your order.
        </p>

        {/* Order Now Button */}
        <button
          type="button"
          onClick={onOrderNow}
          id="btn-order-now"
          className="bg-black hover:bg-neutral-900 text-white px-8 py-3 rounded-full font-bold text-xs tracking-wider uppercase flex items-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Order Now</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#FF6A00]" />
        </button>
      </div>

      {/* Footer minimal tag */}
      <div className="text-[11px] text-neutral-400">
        No login required for customers
      </div>
    </div>
  );
};
