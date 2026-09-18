import React, { useState, useRef, useEffect } from 'react';
import { X, ShieldCheck, KeyRound, ArrowLeft, Check, HelpCircle } from 'lucide-react';
import { ManagerAccount } from '../types';

interface ManagerModalProps {
  onClose: () => void;
  onLogin: () => void;
  managerAccount: ManagerAccount | null;
  onUpdateManagerAccount?: (account: Partial<ManagerAccount>) => void;
}

const DEFAULT_SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What city were you born in?",
  "What is your favorite beverage brand?",
  "What was your first pet's name?",
];

export const ManagerModal: React.FC<ManagerModalProps> = ({
  onClose,
  onLogin,
  managerAccount,
  onUpdateManagerAccount,
}) => {
  // Determine initial mode: If account has no PIN set, go to 'FIRST_TIME_SETUP'
  const isFirstTime = !managerAccount?.pin;
  const [mode, setMode] = useState<'ENTER_PIN' | 'FORGOT_PIN_QUESTION' | 'RESET_PIN' | 'FIRST_TIME_SETUP'>(
    isFirstTime ? 'FIRST_TIME_SETUP' : 'ENTER_PIN'
  );

  // Enter PIN state (4 digits)
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot PIN state
  const [securityAnswerInput, setSecurityAnswerInput] = useState('');
  
  // Setup & Reset PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(
    managerAccount?.securityQuestion || DEFAULT_SECURITY_QUESTIONS[0]
  );
  const [newSecurityAnswer, setNewSecurityAnswer] = useState('');

  useEffect(() => {
    if (mode === 'ENTER_PIN') {
      inputRefs.current[0]?.focus();
    }
  }, [mode]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    setErrorMessage(null);
    const updated = [...pin];
    updated[index] = val.slice(-1);
    setPin(updated);

    if (val && index < 3) {
      inputRefs.current[index + 1]?.focus();
    } else if (val && index === 3) {
      const fullPin = updated.join('');
      verifyAndLogin(fullPin);
    }
  };

  const verifyAndLogin = (enteredPin: string) => {
    const targetPin = managerAccount?.pin || '1234';
    if (enteredPin === targetPin) {
      onLogin();
    } else {
      setErrorMessage('Incorrect PIN. Please try again.');
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleVerifySecurityQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetAnswer = managerAccount?.securityAnswer || 'admin';
    if (securityAnswerInput.trim().toLowerCase() === targetAnswer.trim().toLowerCase()) {
      setMode('RESET_PIN');
      setNewPin('');
      setConfirmPin('');
    } else {
      setErrorMessage('Incorrect answer to security question. Please try again.');
    }
  };

  const handleSaveResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setErrorMessage('PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage('PINs do not match.');
      return;
    }

    if (onUpdateManagerAccount) {
      onUpdateManagerAccount({
        pin: newPin,
      });
    }

    onLogin();
  };

  const handleFirstTimeSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setErrorMessage('PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage('PINs do not match.');
      return;
    }
    if (!newSecurityAnswer.trim()) {
      setErrorMessage('Please enter an answer for your security question.');
      return;
    }

    if (onUpdateManagerAccount) {
      onUpdateManagerAccount({
        pin: newPin,
        securityQuestion: selectedQuestion,
        securityAnswer: newSecurityAnswer.trim(),
      });
    }

    onLogin();
  };

  return (
    <div
      id="manager-pin-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="manager-pin-modal-card"
        className="w-full max-w-[390px] bg-white rounded-3xl shadow-2xl p-6 sm:p-7 relative flex flex-col items-center border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. ENTER PIN MODE */}
        {mode === 'ENTER_PIN' && (
          <div className="w-full flex flex-col items-center text-center">
            {/* Silhouette Icon */}
            <div className="w-14 h-14 mb-2.5 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="22" r="14.5" fill="#000000" />
                <path d="M17 80 C17 62 25 49 39 46 L50 63 L61 46 C75 49 83 62 83 80 Z" fill="#000000" />
                <polygon points="40,46 50,63 60,46" fill="#FFFFFF" />
                <polygon points="36,46 43,58 39,60 32,49" fill="#000000" />
                <polygon points="64,46 57,58 61,60 68,49" fill="#000000" />
                <polygon points="47.5,46 52.5,46 53.5,50 50,52.5 46.5,50" fill="#000000" />
                <polygon points="47.5,52.5 52.5,52.5 54,69 50,74 46,69" fill="#000000" />
              </svg>
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-xl font-bold text-black tracking-tight">Manager PIN</h2>
              <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
            </div>
            <p className="text-xs text-gray-500 mb-6">Enter your 4-digit PIN to access manager section</p>

            {errorMessage && (
              <div className="w-full mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            {/* 4-Digit PIN Boxes */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-[260px] mb-6">
              {pin.map((digit, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square w-full rounded-2xl border border-gray-300 bg-gray-50 flex items-center justify-center focus-within:border-black focus-within:bg-white transition-all"
                >
                  <input
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="absolute inset-0 w-full h-full text-center text-xl font-bold text-transparent caret-black bg-transparent border-none outline-none focus:ring-0"
                  />
                  <span
                    className={`w-3 h-3 rounded-full transition-all ${
                      digit ? 'bg-black scale-100' : 'bg-gray-300 scale-90'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Forgot PIN Link */}
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setMode('FORGOT_PIN_QUESTION');
              }}
              className="text-xs font-semibold text-black hover:text-[#FF6A00] transition-colors mb-5 cursor-pointer underline"
            >
              Forgot PIN?
            </button>

            {/* Enter Button */}
            <button
              type="button"
              onClick={() => verifyAndLogin(pin.join(''))}
              className="w-full bg-black hover:bg-neutral-900 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer text-sm shadow-xs flex items-center justify-center gap-2"
            >
              <span>Enter Manager Section</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
            </button>
          </div>
        )}

        {/* 2. FORGOT PIN - SECURITY QUESTION */}
        {mode === 'FORGOT_PIN_QUESTION' && (
          <form onSubmit={handleVerifySecurityQuestion} className="w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setMode('ENTER_PIN');
              }}
              className="self-start flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-black mb-3 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to PIN</span>
            </button>

            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-2.5 shadow-xs">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-xl font-bold text-black tracking-tight">Security Question</h2>
              <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
            </div>
            <p className="text-xs text-gray-500 text-center mb-5">Answer your security question to reset your PIN</p>

            {errorMessage && (
              <div className="w-full mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 text-center">
                {errorMessage}
              </div>
            )}

            <div className="w-full space-y-4 mb-5">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-black">
                {managerAccount?.securityQuestion || "What is your primary security question?"}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Your Answer
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={securityAnswerInput}
                  onChange={(e) => setSecurityAnswerInput(e.target.value)}
                  placeholder="Enter your security answer"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-all text-black"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-neutral-900 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer text-sm shadow-xs flex items-center justify-center gap-2"
            >
              <span>Verify & Reset PIN</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
            </button>
          </form>
        )}

        {/* 3. RESET PIN */}
        {mode === 'RESET_PIN' && (
          <form onSubmit={handleSaveResetPin} className="w-full flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-2.5 shadow-xs">
              <KeyRound className="w-6 h-6 text-white" />
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-xl font-bold text-black tracking-tight">Reset Manager PIN</h2>
              <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
            </div>
            <p className="text-xs text-gray-500 text-center mb-5">Set your new 4-digit manager PIN</p>

            {errorMessage && (
              <div className="w-full mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 text-center">
                {errorMessage}
              </div>
            )}

            <div className="w-full space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  New 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4 digits"
                  className="w-full px-3.5 py-2.5 text-center text-lg font-bold tracking-widest rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-all text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Re-enter 4 digits"
                  className="w-full px-3.5 py-2.5 text-center text-lg font-bold tracking-widest rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-all text-black"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-neutral-900 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer text-sm shadow-xs flex items-center justify-center gap-2"
            >
              <span>Save PIN & Open Manager</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
            </button>
          </form>
        )}

        {/* 4. FIRST TIME SETUP */}
        {mode === 'FIRST_TIME_SETUP' && (
          <form onSubmit={handleFirstTimeSetup} className="w-full flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-2.5 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h2 className="text-xl font-bold text-black tracking-tight">Set Manager PIN</h2>
              <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">Create your security PIN and recovery question</p>

            {errorMessage && (
              <div className="w-full mb-3.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 text-center">
                {errorMessage}
              </div>
            )}

            <div className="w-full space-y-3 mb-5 max-h-[280px] overflow-y-auto pr-0.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4 digits"
                    className="w-full px-3 py-2 text-center text-base font-bold tracking-widest rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-all text-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Re-enter"
                    className="w-full px-3 py-2 text-center text-base font-bold tracking-widest rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-all text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Security Question
                </label>
                <select
                  value={selectedQuestion}
                  onChange={(e) => setSelectedQuestion(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-all text-black"
                >
                  {DEFAULT_SECURITY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Security Answer
                </label>
                <input
                  type="text"
                  required
                  value={newSecurityAnswer}
                  onChange={(e) => setNewSecurityAnswer(e.target.value)}
                  placeholder="Your secret answer"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-gray-50 border border-gray-300 focus:outline-none focus:border-black focus:bg-white transition-all text-black"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-neutral-900 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer text-sm shadow-xs flex items-center justify-center gap-2"
            >
              <span>Save & Continue</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
