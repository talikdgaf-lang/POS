import React from 'react';
import { X, ArrowLeft, Banknote, CheckCircle2, ArrowRight } from 'lucide-react';

interface CashModalProps {
  totalAmount: number;
  customerName?: string;
  onClose: () => void;
  onBackToMethods: () => void;
  onSuccess: () => void;
}

export const CashModal: React.FC<CashModalProps> = ({
  totalAmount,
  customerName,
  onClose,
  onBackToMethods,
  onSuccess,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-[460px] bg-white rounded-3xl p-6 sm:p-8 relative shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBackToMethods}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 ml-auto"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cash Icon */}
        <div className="mx-auto mb-3 w-16 h-14 rounded-2xl bg-[#1c2430] flex items-center justify-center text-white shadow-sm">
          <Banknote className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 text-center tracking-tight">
          Pay with <span className="text-[#ff5500]">Cash</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 text-center mt-1 mb-6">
          You can pay in cash when your order arrives.
        </p>

        {/* Order Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-2 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Customer:</span>
            <span className="font-bold text-gray-900">{customerName || 'Customer'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Amount Due on Delivery:</span>
            <span className="font-extrabold text-[#ff5500] text-sm">
              KSh {totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Payment Terms:</span>
            <span className="font-medium text-gray-700">Cash on Delivery</span>
          </div>
        </div>

        {/* Confirm Order Button */}
        <button
          type="button"
          id="btn-confirm-cash-order"
          onClick={onSuccess}
          className="w-full bg-[#111827] hover:bg-black text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base transition-colors shadow-md cursor-pointer"
        >
          <span>Confirm Cash Order</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
