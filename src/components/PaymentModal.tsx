import React, { useState } from 'react';
import { X, ArrowRight, Smartphone, Banknote } from 'lucide-react';
import { PaymentMethod } from '../types';

interface PaymentModalProps {
  onClose: () => void;
  onConfirm?: (method: PaymentMethod) => void;
  totalAmount?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onConfirm, totalAmount }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mpesa');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-[480px] bg-white rounded-3xl p-8 relative shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Orange Brand Icon */}
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#ff5500] flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 22h8" />
            <path d="M12 11v11" />
            <path d="m19 3-7 8-7-8Z" />
          </svg>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">
          Choose <span className="text-[#ff5500]">Payment Method</span>
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          How would you like to pay for your order?
        </p>

        {/* Option 1: Pay with M-PESA */}
        <div
          onClick={() => setSelectedMethod('mpesa')}
          className={`w-full p-4 rounded-2xl flex items-center justify-between cursor-pointer mb-3.5 transition-all ${
            selectedMethod === 'mpesa'
              ? 'border-2 border-[#ff5500] bg-orange-50/20'
              : 'border border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3.5">
            {/* Green M-PESA Badge */}
            <div className="w-13 h-12 rounded-xl bg-[#00a859] flex flex-col items-center justify-center text-white shrink-0 shadow-xs">
              <Smartphone className="w-4 h-4 mb-0.5" />
              <span className="text-[9px] font-black tracking-tighter uppercase leading-none">M-PESA</span>
            </div>
            <div className="text-left">
              <h4 className="text-base font-bold text-gray-900">Pay with M-PESA</h4>
              <p className="text-xs text-gray-500 mt-0.5">Secure and instant payment via M-PESA.</p>
            </div>
          </div>
          {/* Custom Radio Button */}
          <div className="w-5 h-5 rounded-full border-2 border-[#ff5500] flex items-center justify-center shrink-0">
            {selectedMethod === 'mpesa' && (
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5500]" />
            )}
          </div>
        </div>

        {/* Option 2: Pay with Cash */}
        <div
          onClick={() => setSelectedMethod('cash')}
          className={`w-full p-4 rounded-2xl flex items-center justify-between cursor-pointer mb-6 transition-all ${
            selectedMethod === 'cash'
              ? 'border-2 border-[#ff5500] bg-orange-50/20'
              : 'border border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3.5">
            {/* Dark Cash Badge */}
            <div className="w-13 h-12 rounded-xl bg-[#1c2430] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Banknote className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h4 className="text-base font-bold text-gray-900">Pay with Cash</h4>
              <p className="text-xs text-gray-500 mt-0.5">Pay when your order is delivered.</p>
            </div>
          </div>
          {/* Custom Radio Button */}
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            selectedMethod === 'cash' ? 'border-[#ff5500]' : 'border-gray-300'
          }`}>
            {selectedMethod === 'cash' && (
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5500]" />
            )}
          </div>
        </div>

        {/* Action Button: Continue with M-Pesa / Cash */}
        <button
          type="button"
          onClick={() => {
            if (onConfirm) onConfirm(selectedMethod);
            else onClose();
          }}
          id="btn-payment-continue"
          className={`w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-base transition-colors shadow-sm cursor-pointer ${
            selectedMethod === 'mpesa'
              ? 'bg-[#00a859] hover:bg-[#00924d]'
              : 'bg-[#ff5500] hover:bg-[#e64d00]'
          }`}
        >
          <span>
            {selectedMethod === 'mpesa'
              ? `Continue with M-Pesa${totalAmount ? ` • KSh ${totalAmount.toLocaleString()}` : ''}`
              : `Continue with Cash${totalAmount ? ` • KSh ${totalAmount.toLocaleString()}` : ''}`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
