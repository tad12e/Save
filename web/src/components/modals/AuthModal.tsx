import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  KeyRound, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { signupBackend, signinBackend, verifyOTPBackend, resendOTPBackend } from '../../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: any, tokens: { access: string; refresh: string }) => void;
  initialMode?: 'SIGNIN' | 'SIGNUP';
  theme?: 'light' | 'dark' | 'terminal';
}

type AuthMode = 'SIGNIN' | 'SIGNUP' | 'OTP_VERIFY';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  initialMode = 'SIGNIN',
  theme = 'light'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  React.useEffect(() => {
    if (initialMode && isOpen) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark' || theme === 'terminal';

  const handleResetState = () => {
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    handleResetState();
    setLoading(true);
    try {
      const res = await signinBackend({ email, password });
      onAuthSuccess(res.user, { access: res.access, refresh: res.refresh });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    handleResetState();
    setLoading(true);
    try {
      const res = await signupBackend({ name, email, password });
      setInfoMsg(res.message || 'Verification code sent to your email.');
      setMode('OTP_VERIFY');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    handleResetState();
    setLoading(true);
    try {
      const res = await verifyOTPBackend({ email, otp });
      onAuthSuccess(res.user, { access: res.access, refresh: res.refresh });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    handleResetState();
    setLoading(true);
    try {
      const res = await resendOTPBackend(email);
      setInfoMsg(res.message || 'A new OTP has been sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all ${
      isDark ? 'bg-black/80' : 'bg-slate-900/40'
    }`}>
      <div className={`relative w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl font-sans space-y-6 overflow-hidden transition-all ${
        isDark 
          ? 'bg-[#0A0A0A] border border-[#262626] text-[#EDEDED] shadow-black/80' 
          : 'bg-white border border-slate-200/90 text-slate-900 shadow-slate-900/20'
      }`}>
        
        {/* Subtle decorative radial glow */}
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-2xl pointer-events-none ${
          isDark ? 'bg-blue-500/10' : 'bg-blue-500/15'
        }`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className={`absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer z-20 ${
            isDark 
              ? 'text-[#878787] hover:text-white hover:bg-[#1A1A1A]' 
              : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header with Genuine Yazem Squircle Logo */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex w-12 h-12 rounded-2xl items-center justify-center bg-black text-white shadow-md border border-black/10 mb-1 transition-transform hover:scale-105 select-none">
            <span className="font-extrabold text-xl tracking-tighter">
              Y<span className="text-sky-400">.</span>
            </span>
          </div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {mode === 'SIGNIN' && 'Sign in to Yazem'}
            {mode === 'SIGNUP' && 'Create Your Yazem Account'}
            {mode === 'OTP_VERIFY' && 'Email Verification'}
          </h2>
          <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
            {mode === 'SIGNIN' && 'Access your synced clips, destinations, and custom AI vaults.'}
            {mode === 'SIGNUP' && 'Start clipping opportunities & auto-syncing to your workspaces.'}
            {mode === 'OTP_VERIFY' && `Enter the 6-digit verification code sent to ${email}`}
          </p>
        </div>

        {/* Status Banners */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs font-sans flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 text-xs font-sans flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Mode Forms */}
        {mode === 'SIGNIN' && (
          <form onSubmit={handleSignin} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className={`block text-[11px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-[#666]' : 'text-slate-400'
                }`} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-xs font-sans transition-all focus:outline-none ${
                    isDark 
                      ? 'bg-[#121212] border border-[#222222] text-white placeholder-[#555] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-[11px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-[#666]' : 'text-slate-400'
                }`} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-xs font-sans transition-all focus:outline-none ${
                    isDark 
                      ? 'bg-[#121212] border border-[#222222] text-white placeholder-[#555] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 font-semibold uppercase tracking-wider text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-white hover:bg-slate-100 text-black shadow-white/10' 
                  : 'bg-slate-950 hover:bg-black text-white shadow-slate-950/20'
              }`}
            >
              {loading ? <RefreshCw className={`w-4 h-4 animate-spin ${isDark ? 'text-black' : 'text-white'}`} /> : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { handleResetState(); setMode('SIGNUP'); }}
                className={`text-xs transition-colors cursor-pointer ${
                  isDark ? 'text-[#878787] hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Don't have an account? <strong className="text-blue-600 hover:underline font-semibold ml-1">Register Now</strong>
              </button>
            </div>
          </form>
        )}

        {mode === 'SIGNUP' && (
          <form onSubmit={handleSignup} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className={`block text-[11px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-700'
              }`}>
                Full Name
              </label>
              <div className="relative">
                <UserIcon className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-[#666]' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-xs font-sans transition-all focus:outline-none ${
                    isDark 
                      ? 'bg-[#121212] border border-[#222222] text-white placeholder-[#555] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-[11px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-[#666]' : 'text-slate-400'
                }`} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-xs font-sans transition-all focus:outline-none ${
                    isDark 
                      ? 'bg-[#121212] border border-[#222222] text-white placeholder-[#555] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-[11px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-[#666]' : 'text-slate-400'
                }`} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-xs font-sans transition-all focus:outline-none ${
                    isDark 
                      ? 'bg-[#121212] border border-[#222222] text-white placeholder-[#555] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30' 
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 font-semibold uppercase tracking-wider text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-white hover:bg-slate-100 text-black shadow-white/10' 
                  : 'bg-slate-950 hover:bg-black text-white shadow-slate-950/20'
              }`}
            >
              {loading ? <RefreshCw className={`w-4 h-4 animate-spin ${isDark ? 'text-black' : 'text-white'}`} /> : (
                <>
                  <span>Create Account & Send OTP</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { handleResetState(); setMode('SIGNIN'); }}
                className={`text-xs transition-colors cursor-pointer ${
                  isDark ? 'text-[#878787] hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Already have an account? <strong className="text-blue-600 hover:underline font-semibold ml-1">Sign In</strong>
              </button>
            </div>
          </form>
        )}

        {mode === 'OTP_VERIFY' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className={`block text-[11px] font-semibold uppercase tracking-wider text-center ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-700'
              }`}>
                6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-[#666]' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  placeholder="123456"
                  className={`w-full pl-10 pr-3.5 py-3 rounded-xl text-base font-mono tracking-[0.5em] text-center font-bold transition-all focus:outline-none ${
                    isDark 
                      ? 'bg-[#121212] border border-[#222222] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30' 
                      : 'bg-slate-50 border border-slate-200 text-slate-950 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 font-semibold uppercase tracking-wider text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-white hover:bg-slate-100 text-black shadow-white/10' 
                  : 'bg-slate-950 hover:bg-black text-white shadow-slate-950/20'
              }`}
            >
              {loading ? <RefreshCw className={`w-4 h-4 animate-spin ${isDark ? 'text-black' : 'text-white'}`} /> : (
                <>
                  <span>Verify Code & Sign In</span>
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            <div className={`flex items-center justify-between text-xs pt-2 ${
              isDark ? 'text-[#878787]' : 'text-slate-500'
            }`}>
              <button
                type="button"
                onClick={handleResendOTP}
                className="hover:text-blue-600 underline cursor-pointer"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => setMode('SIGNIN')}
                className={`cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
