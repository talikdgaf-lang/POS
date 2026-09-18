import React, { useState } from 'react';
import { X, Smartphone, Laptop, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../utils/firebase';
import { ManagerAccount } from '../types';

interface GoogleLoginModalProps {
  currentAccount?: ManagerAccount | null;
  roleMode?: 'MANAGER' | 'WORKER';
  onClose: () => void;
  onLoginSuccess: (account: ManagerAccount, roleMode: 'MANAGER' | 'WORKER') => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  currentAccount,
  roleMode = 'MANAGER',
  onClose,
  onLoginSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Real Google Sign-In with Firebase popup
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const userProfile = await signInWithGoogle();
      if (userProfile && userProfile.email) {
        const account: ManagerAccount = {
          uid: userProfile.uid,
          email: userProfile.email.toLowerCase().trim(),
          displayName: userProfile.displayName || userProfile.email.split('@')[0],
          photoURL: userProfile.photoURL,
          venueName: `${userProfile.displayName || 'Manager'}'s Rios POS`,
        };
        onLoginSuccess(account, roleMode);
      }
    } catch (err: any) {
      console.warn('Google Popup blocked/issue:', err);
      setErrorMessage(
        'Google popup blocked by browser. You can enter or select your Google email below for instant access.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Direct email login (for immediate multi-device sync)
  const handleQuickLogin = (emailToUse: string, displayName?: string) => {
    const cleanEmail = emailToUse.toLowerCase().trim();
    if (!cleanEmail) return;

    const rawName = displayName || (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail);
    const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    const account: ManagerAccount = {
      uid: `google-${cleanEmail}`,
      email: cleanEmail,
      displayName: capitalizedName,
      venueName: cleanEmail === 'talikdgaf@gmail.com' ? "Rio's POS" : `${capitalizedName}'s Rios POS`,
    };

    onLoginSuccess(account, roleMode);
  };

  const isManager = roleMode === 'MANAGER';

  return (
    <div
      id="google-login-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="google-login-modal-card"
        className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl p-6 sm:p-7 relative flex flex-col items-center border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-3 shadow-xs">
          <svg className="w-7 h-7" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1.5">
          <h2 className="text-xl font-bold text-black tracking-tight text-center">
            {isManager ? 'Manager Google Login' : 'Worker Google Login'}
          </h2>
          <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
        </div>
        <p className="text-xs text-gray-500 text-center mt-1 mb-5 max-w-xs">
          {isManager
            ? 'Sign in with your Google email to manage your bar, inventory, and staff.'
            : 'Sign in with your Google email to connect to your bar and worker station.'}
        </p>

        {errorMessage && (
          <div className="w-full mb-3.5 p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs flex items-start gap-1.5">
            <span className="font-bold">Notice:</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          id="btn-sign-in-with-google"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-white border border-gray-300 hover:border-black text-black font-bold text-sm flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="w-full flex items-center gap-2.5 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Or Use Google Email
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Quick Email Selection / Input */}
        <div className="w-full flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('talikdgaf@gmail.com', 'Talik')}
            className="w-full p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-black flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black text-white font-bold flex items-center justify-center text-xs">
                T
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-black">Talik</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-800">
                    Active
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-mono">talikdgaf@gmail.com</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
          </button>

          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="text-xs font-semibold text-gray-600 hover:text-black py-1 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span>Enter another Google email</span>
            </button>
          ) : (
            <div className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2 animate-in fade-in duration-100">
              <label className="text-[11px] font-bold text-gray-700">Enter Google Email:</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="e.g. manager@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-300 focus:outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => handleQuickLogin(customEmail)}
                  disabled={!customEmail.trim()}
                  className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Log In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="w-full mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-3 text-gray-400 text-[11px]">
          <div className="flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-gray-600" />
            <span>Mobile</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Laptop className="w-3 h-3 text-gray-600" />
            <span>Laptop</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1 text-black font-semibold">
            <CheckCircle2 className="w-3 h-3 text-[#FF6A00]" />
            <span>Cloud Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
