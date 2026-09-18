import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Smartphone, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface MpesaModalProps {
  totalAmount: number;
  customerName?: string;
  onClose: () => void;
  onBackToMethods: () => void;
  onSuccess: () => void;
}

type MpesaStep = 'ENTER_PHONE' | 'WAITING';

export const MpesaModal: React.FC<MpesaModalProps> = ({
  totalAmount,
  customerName,
  onClose,
  onBackToMethods,
  onSuccess,
}) => {
  const [step, setStep] = useState<MpesaStep>('ENTER_PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [progressStatus, setProgressStatus] = useState('Initiating STK Push...');

  // Auto-format phone input into Kenyan standard
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setPhoneNumber(raw);
    if (errorMessage) setErrorMessage('');
  };

  // Helper to validate Kenyan phone number
  const validateKenyanPhone = (number: string): boolean => {
    const cleaned = number.replace(/\D/g, '');
    if (/^(?:254)?(7|1)\d{8}$/.test(cleaned) || /^0(7|1)\d{8}$/.test(cleaned)) {
      return true;
    }
    return false;
  };

  const getDisplayPhone = (raw: string): string => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+254 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.length === 9) {
      return `+254 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return raw;
  };

  const handleSubmitNumber = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (!cleaned) {
      setErrorMessage('Please enter your M-PESA phone number');
      return;
    }

    if (!validateKenyanPhone(cleaned)) {
      setErrorMessage('Please enter a valid Safaricom number (e.g. 0712 345 678)');
      return;
    }

    setErrorMessage('');
    setStep('WAITING');
  };

  // Simulating STK push handshake, user PIN entry, and confirmation
  useEffect(() => {
    if (step !== 'WAITING') return;

    setProgressStatus('Sending STK Push prompt to your phone...');

    const timer1 = setTimeout(() => {
      setProgressStatus('STK Push prompt sent! Please enter your PIN on your phone...');
    }, 1800);

    const timer2 = setTimeout(() => {
      setProgressStatus('PIN verified! Payment approved...');
    }, 4000);

    const timer3 = setTimeout(() => {
      // Transition directly to the actual tracking screen via App.tsx
      onSuccess();
    }, 5200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [step]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-[480px] bg-white rounded-3xl p-6 sm:p-8 relative shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between mb-4">
          {step === 'ENTER_PHONE' ? (
            <button
              type="button"
              onClick={onBackToMethods}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors p-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step !== 'WAITING' && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1 ml-auto"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* STEP 1: Enter Phone Number */}
        {step === 'ENTER_PHONE' && (
          <form onSubmit={handleSubmitNumber} className="flex flex-col">
            {/* M-PESA Badge Icon */}
            <div className="mx-auto mb-3 w-16 h-14 rounded-2xl bg-[#00a859] flex flex-col items-center justify-center text-white shadow-sm">
              <Smartphone className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-black tracking-wider uppercase leading-none">M-PESA</span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-2xl font-extrabold text-gray-900 text-center tracking-tight">
              Pay with <span className="text-[#00a859]">M-PESA</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-1 mb-5">
              Enter your Safaricom mobile number to receive the prompt.
            </p>

            {/* Amount Summary Card */}
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-3.5 mb-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-700 font-medium block">Total Payable</span>
                <span className="text-lg sm:text-xl font-black text-emerald-950">
                  KSh {totalAmount.toLocaleString()}
                </span>
              </div>
              {customerName && (
                <div className="text-right">
                  <span className="text-[11px] text-emerald-700 font-medium block">Customer</span>
                  <span className="text-xs font-bold text-emerald-950 truncate max-w-[140px] block">
                    {customerName}
                  </span>
                </div>
              )}
            </div>

            {/* Input Group */}
            <div className="space-y-1.5 mb-5">
              <label htmlFor="mpesa-phone-input" className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                M-PESA Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-gray-500 text-sm font-semibold border-r border-gray-200 pr-2.5">
                  <span className="text-base">🇰🇪</span>
                  <span>+254</span>
                </div>
                <input
                  id="mpesa-phone-input"
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="0712 345 678"
                  className={`w-full bg-gray-50 text-gray-900 pl-24 pr-4 py-3.5 rounded-xl border text-base font-semibold outline-none transition-all placeholder:text-gray-400 ${
                    errorMessage
                      ? 'border-red-500 ring-2 ring-red-100 bg-red-50/20'
                      : 'border-gray-300 focus:border-[#00a859] focus:ring-2 focus:ring-[#00a859]/20 focus:bg-white'
                  }`}
                />
              </div>
              {errorMessage ? (
                <p className="text-xs text-red-600 font-medium mt-1">{errorMessage}</p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1">
                  Format: 07XX XXX XXX or 01XX XXX XXX
                </p>
              )}
            </div>

            {/* Notice */}
            <div className="bg-gray-50 rounded-xl p-3 mb-6 flex items-start gap-2.5 border border-gray-100">
              <ShieldCheck className="w-4 h-4 text-[#00a859] shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-600 leading-relaxed">
                An STK Push prompt will be sent to your phone. Enter your secret M-PESA PIN when prompted to authorize the transaction.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-submit-mpesa-number"
              className="w-full bg-[#00a859] hover:bg-[#00924d] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-base transition-colors shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99]"
            >
              <span>Send STK Push • KSh {totalAmount.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Loading & Waiting for Confirmation */}
        {step === 'WAITING' && (
          <div className="flex flex-col items-center text-center py-4">
            {/* Animated Ring Loader */}
            <div className="relative mb-6 flex items-center justify-center">
              {/* Outer Pulsing Glow */}
              <div className="w-24 h-24 rounded-full bg-emerald-100 animate-ping opacity-60 absolute" />
              {/* Spinning Ring */}
              <div className="w-20 h-20 rounded-full border-4 border-emerald-100 border-t-[#00a859] animate-spin" />
              {/* Center Phone Icon */}
              <div className="absolute w-12 h-12 rounded-full bg-[#00a859] flex items-center justify-center text-white shadow-md">
                <Smartphone className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            {/* Headline */}
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
              Waiting for Payment...
            </h3>

            {/* Sent To Target */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold mb-4">
              <span>Prompt sent to:</span>
              <span className="font-mono">{getDisplayPhone(phoneNumber)}</span>
            </div>

            {/* Current Realtime Status */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 w-full mb-6">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00a859]" />
                <span>{progressStatus}</span>
              </div>

              <div className="text-left text-xs text-gray-500 space-y-1.5 pt-2 border-t border-gray-200/60">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#00a859] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Check phone screen for the M-PESA pop-up</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#00a859] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Enter your secret 4-digit M-PESA PIN</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#00a859] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Amount to pay: <strong>KSh {totalAmount.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setStep('ENTER_PHONE')}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors underline cursor-pointer"
            >
              Didn't receive the prompt? Re-enter number
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

