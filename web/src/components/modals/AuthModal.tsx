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
  ShieldCheck,
  Zap
} from 'lucide-react';
import { signupBackend, signinBackend, verifyOTPBackend, resendOTPBackend } from '../../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: any, tokens: { access: string; refresh: string }) => void;
}

type AuthMode = 'SIGNIN' | 'SIGNUP' | 'OTP_VERIFY';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('SIGNIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 font-sans text-[#EDEDED] space-y-6 overflow-hidden">
        
        {/* Subtle top glow matching Stitch emerald theme */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#3FE769]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 w-8 h-8 rounded-lg flex items-center justify-center text-[#878787] hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-[#3FE769] shadow-sm mb-1">
            <Zap className="w-6 h-6 fill-[#3FE769] text-[#3FE769]" />
          </div>
          <h2 className="text-2xl font-sans font-bold text-white tracking-tight">
            {mode === 'SIGNIN' && 'Sign in to Save'}
            {mode === 'SIGNUP' && 'Create Your Save Account'}
            {mode === 'OTP_VERIFY' && 'Email Verification'}
          </h2>
          <p className="text-xs text-[#878787] font-sans max-w-xs mx-auto leading-relaxed">
            {mode === 'SIGNIN' && 'Access your synced clips, destinations, and custom AI vaults.'}
            {mode === 'SIGNUP' && 'Start clipping opportunities & auto-syncing to your workspaces.'}
            {mode === 'OTP_VERIFY' && `Enter the 6-digit verification code sent to ${email}`}
          </p>
        </div>

        {/* Status Banners */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-sans flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[#3FE769] text-xs font-sans flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-[#3FE769]" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Mode Forms */}
        {mode === 'SIGNIN' && (
          <form onSubmit={handleSignin} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#121212] border border-[#222222] rounded-xl text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#121212] border border-[#222222] rounded-xl text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#3FE769] hover:bg-[#34c759] text-black font-sans font-semibold uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(63,231,105,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : (
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
                className="text-xs font-sans text-[#878787] hover:text-white transition-colors cursor-pointer"
              >
                Don't have an account? <strong className="text-[#3FE769] hover:underline font-semibold ml-1">Register Now</strong>
              </button>
            </div>
          </form>
        )}

        {mode === 'SIGNUP' && (
          <form onSubmit={handleSignup} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#121212] border border-[#222222] rounded-xl text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#121212] border border-[#222222] rounded-xl text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#121212] border border-[#222222] rounded-xl text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#3FE769] hover:bg-[#34c759] text-black font-sans font-semibold uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(63,231,105,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : (
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
                className="text-xs font-sans text-[#878787] hover:text-white transition-colors cursor-pointer"
              >
                Already have an account? <strong className="text-[#3FE769] hover:underline font-semibold ml-1">Sign In</strong>
              </button>
            </div>
          </form>
        )}

        {mode === 'OTP_VERIFY' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1] text-center">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  placeholder="123456"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#121212] border border-[#222222] rounded-xl text-base text-[#3FE769] font-mono tracking-[0.5em] focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 text-center transition-colors font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#3FE769] hover:bg-[#34c759] text-black font-sans font-semibold uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(63,231,105,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : (
                <>
                  <span>Verify Code & Sign In</span>
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs font-sans text-[#878787] pt-2">
              <button
                type="button"
                onClick={handleResendOTP}
                className="hover:text-[#3FE769] underline cursor-pointer"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => setMode('SIGNIN')}
                className="hover:text-white cursor-pointer"
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
