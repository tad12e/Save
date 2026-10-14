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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#080808] border border-amber-500/30 rounded-sm p-6 sm:p-8 shadow-2xl shadow-amber-500/10 font-sans text-stone-200 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1">
            <Zap className="w-6 h-6 fill-amber-400" />
          </div>
          <h2 className="text-2xl font-serif font-extrabold text-white tracking-tight">
            {mode === 'SIGNIN' && 'Sign in to Save'}
            {mode === 'SIGNUP' && 'Create Your Save Account'}
            {mode === 'OTP_VERIFY' && 'Email Verification'}
          </h2>
          <p className="text-xs text-stone-400 font-sans">
            {mode === 'SIGNIN' && 'Access your synced clips, destinations, and custom AI vaults.'}
            {mode === 'SIGNUP' && 'Start clipping opportunities & auto-syncing to your workspaces.'}
            {mode === 'OTP_VERIFY' && `Enter the 6-digit verification code sent to ${email}`}
          </p>
        </div>

        {/* Status Banners */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-sm text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-amber-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Mode Forms */}
        {mode === 'SIGNIN' && (
          <form onSubmit={handleSignin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#050505] border border-white/10 rounded-sm text-xs text-stone-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#050505] border border-white/10 rounded-sm text-xs text-stone-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold uppercase tracking-wider text-xs rounded-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { handleResetState(); setMode('SIGNUP'); }}
                className="text-xs font-mono text-stone-400 hover:text-amber-400 transition-colors"
              >
                Don't have an account? <strong className="text-amber-400 underline">Register Now</strong>
              </button>
            </div>
          </form>
        )}

        {mode === 'SIGNUP' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#050505] border border-white/10 rounded-sm text-xs text-stone-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#050505] border border-white/10 rounded-sm text-xs text-stone-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#050505] border border-white/10 rounded-sm text-xs text-stone-200 font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold uppercase tracking-wider text-xs rounded-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : (
                <>
                  <span>Create Account & Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { handleResetState(); setMode('SIGNIN'); }}
                className="text-xs font-mono text-stone-400 hover:text-amber-400 transition-colors"
              >
                Already have an account? <strong className="text-amber-400 underline">Sign In</strong>
              </button>
            </div>
          </form>
        )}

        {mode === 'OTP_VERIFY' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">6-Digit Verification Code</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#050505] border border-white/10 rounded-sm text-sm text-amber-400 font-mono tracking-widest focus:border-amber-500 outline-none text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold uppercase tracking-wider text-xs rounded-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : (
                <>
                  <span>Verify Code & Sign In</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs font-mono text-stone-400 pt-2">
              <button
                type="button"
                onClick={handleResendOTP}
                className="hover:text-amber-400 underline"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => setMode('SIGNIN')}
                className="hover:text-stone-200"
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
