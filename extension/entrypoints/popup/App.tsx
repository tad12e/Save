import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Check, 
  Settings, 
  LogOut, 
  Link as LinkIcon, 
  Sparkles, 
  Bookmark, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api, User, Clip } from '../../utils/api';
import './App.css';

declare const chrome: any;

type Screen = 'SIGNIN' | 'SIGNUP' | 'OTP_VERIFY' | 'DASHBOARD' | 'SETTINGS';

function App() {
  // Screens & Navigation
  const [screen, setScreen] = useState<Screen>('SIGNIN');
  const [user, setUser] = useState<User | null>(null);
  
  // Settings & Configuration
  const [mockMode, setMockMode] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>('http://127.0.0.1:8000');

  // Input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  
  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // OTP Verification specific states
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Dashboard / Clip saving states
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'duplicate' | 'error'>('idle');
  const [savedClip, setSavedClip] = useState<Clip | null>(null);

  // Initialize
  useEffect(() => {
    // Check if logged in
    const currentUser = api.getCurrentUser();
    const token = api.getAccessToken();
    
    setMockMode(api.isMockMode());
    setApiUrl(api.getBaseUrl());

    if (currentUser && token) {
      setUser(currentUser);
      setScreen('DASHBOARD');
    } else {
      setScreen('SIGNIN');
    }

    // Get current tab details if in extension context
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs && tabs[0]) {
          setCurrentUrl(tabs[0].url || '');
          setCurrentTitle(tabs[0].title || '');
        }
      });
      // Try to get selected text if any
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => window.getSelection()?.toString() || '',
          }, (results: any[]) => {
            if (results && results[0] && results[0].result) {
              setSelectedText(results[0].result);
            }
          });
        }
      });
    } else {
      // Fallback for local browser testing
      setCurrentUrl('https://github.com/wxt-dev/wxt');
      setCurrentTitle('WXT - Next-gen Web Extension Framework');
      setSelectedText('WXT is a next-gen framework for building browser extensions. It is fast, developer-friendly, and supports multiple browsers out of the box.');
    }
  }, []);

  // Resend OTP timer cooldown
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setOtpResendCooldown(otpResendCooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpResendCooldown]);

  // Update mock mode
  const handleToggleMockMode = (checked: boolean) => {
    setMockMode(checked);
    api.setMockMode(checked);
    setError(null);
    setSuccess(`Mock Mode ${checked ? 'enabled' : 'disabled'}.`);
  };

  // Update base URL
  const handleSaveApiUrl = () => {
    api.setBaseUrl(apiUrl);
    setSuccess('API Base URL updated successfully.');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Sign In submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.signin({ email, password });
      setUser(res.user);
      setScreen('DASHBOARD');
      setSaveStatus('idle');
      setSavedClip(null);
    } catch (err: any) {
      // Check if user is unverified and needs OTP verification
      if (err.message && err.message.toLowerCase().includes('verify your email')) {
        setError('Verification pending. We sent a new code.');
        // Trigger resend to be sure or just proceed to OTP page
        try {
          await api.resendOtp(email);
        } catch {}
        setScreen('OTP_VERIFY');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.signup({ name: fullName, email, password });
      setSuccess('Verification OTP sent to your email.');
      setScreen('OTP_VERIFY');
      setOtpResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP digital input handlers
  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return; // only digits
    
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1); // only keep last character
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (val !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpDigits[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length !== 6 || isNaN(Number(pastedData))) return;

    const newDigits = pastedData.split('');
    setOtpDigits(newDigits);
    otpRefs.current[5]?.focus();
  };

  // OTP verification submit
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.verifyOtp(email, otp);
      setUser(res.user);
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        setScreen('DASHBOARD');
        setSuccess(null);
        setSaveStatus('idle');
        setSavedClip(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (otpResendCooldown > 0) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.resendOtp(email);
      setSuccess('A new OTP has been sent to your email.');
      setOtpResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Auth simulated/actual
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real extension popup, we'd launch chrome.identity.launchWebAuthFlow
      // Here, we fetch using a mock google token or prompt.
      // If we are in mock mode, it proceeds instantly.
      const mockToken = 'google_mock_access_token_123456';
      const res = await api.googleAuth(mockToken);
      setUser(res.user);
      setScreen('DASHBOARD');
      setSaveStatus('idle');
      setSavedClip(null);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save clip handler
  const handleSaveClip = async () => {
    setSaveStatus('saving');
    setError(null);

    try {
      const res = await api.saveClip(currentUrl, selectedText);
      setSavedClip(res);
      if (res.duplicate) {
        setSaveStatus('duplicate');
      } else {
        setSaveStatus('saved');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save clip.');
      setSaveStatus('error');
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    api.logout();
    setUser(null);
    setPassword('');
    setOtpDigits(Array(6).fill(''));
    setScreen('SIGNIN');
    setError(null);
    setSuccess(null);
  };

  // Custom Logo Component matching screenshot aesthetics
  const ClipperHeader = ({ showStatusDot = false }) => (
    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
      <div className="flex items-center gap-3">
        {/* Dark Navy Square with lines */}
        <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] flex items-center justify-center shadow-md shadow-violet-900/10">
          <div className="flex flex-col gap-1 items-start w-5">
            <span className="w-4 h-0.5 bg-violet-400 rounded-full"></span>
            <span className="w-5 h-0.5 bg-white rounded-full"></span>
            <span className="w-2.5 h-0.5 bg-violet-400 rounded-full"></span>
          </div>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 text-base leading-none">Clipper</h1>
          <p className="text-xs text-gray-400 mt-0.5">Save anything, anywhere</p>
        </div>
      </div>

      {showStatusDot ? (
        <div className="flex items-center gap-1 bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse"></span>
          active
        </div>
      ) : (
        /* Decorative pill matching top right in Sign Up screenshot */
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-2 bg-violet-600 rounded-full"></span>
          <span className="w-2 h-2 bg-gray-200 rounded-full"></span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-[375px] min-h-[600px] bg-white flex flex-col justify-between p-6 box-border relative">
      
      {/* Alert banner for critical status */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-red-600/90 mt-0.5 leading-normal">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Success</p>
            <p className="text-emerald-700/90 mt-0.5 leading-normal">{success}</p>
          </div>
        </div>
      )}

      {/* Screen Rendering */}
      <div>
        {/* SIGN IN SCREEN */}
        {screen === 'SIGNIN' && (
          <div className="animate-in fade-in duration-300">
            <ClipperHeader />
            
            <div className="mt-6 mb-6">
              <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Welcome back</h2>
              <p className="text-[13px] text-gray-500 mt-1">Sign in to access your clips and destinations.</p>
            </div>

            <button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors font-semibold text-gray-700 text-[14px] shadow-sm mb-5"
            >
              {/* Google Colored Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="h-px bg-gray-100 flex-1"></span>
              <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">or sign in with email</span>
              <span className="h-px bg-gray-100 flex-1"></span>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-[14px] text-gray-800 transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full pl-3.5 pr-12 py-2.5 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-[14px] text-gray-800 transition-all placeholder:text-gray-400"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold select-none focus:outline-none"
                  >
                    {passwordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => {
                    setError('Password reset is not implemented. Please use sign-up or sign-in in Mock Mode.');
                    setTimeout(() => setError(null), 3000);
                  }}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-500"
                >
                  Forgot password?
                </button>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-[14px] hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none flex items-center justify-center gap-2"
              >
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Sign in
              </button>
            </form>
          </div>
        )}

        {/* SIGN UP SCREEN */}
        {screen === 'SIGNUP' && (
          <div className="animate-in fade-in duration-300">
            <ClipperHeader />

            <div className="mt-6 mb-6">
              <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Create your account</h2>
              <p className="text-[13px] text-gray-500 mt-1">Start saving anything from any website in one tap.</p>
            </div>

            <button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors font-semibold text-gray-700 text-[14px] shadow-sm mb-5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="h-px bg-gray-100 flex-1"></span>
              <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">or use email</span>
              <span className="h-px bg-gray-100 flex-1"></span>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Full name</label>
                <input 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tadiwos Alemu"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-[14px] text-gray-800 transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-[14px] text-gray-800 transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-3.5 pr-12 py-2.5 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-[14px] text-gray-800 transition-all placeholder:text-gray-400"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold select-none focus:outline-none"
                  >
                    {passwordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-[14px] hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none flex items-center justify-center gap-2 mt-2"
              >
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Create account
              </button>
            </form>
          </div>
        )}

        {/* OTP VERIFICATION SCREEN */}
        {screen === 'OTP_VERIFY' && (
          <div className="animate-in fade-in duration-300">
            <ClipperHeader />

            <div className="mt-6 mb-6">
              <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Verify your email</h2>
              <p className="text-[13px] text-gray-500 mt-1">
                We sent a 6-digit verification code to <span className="font-semibold text-gray-700">{email}</span>.
              </p>
              {mockMode && (
                <div className="mt-2 bg-violet-50 text-violet-700 text-xs p-2 rounded-lg font-medium">
                  💡 Mock Mode tip: Enter <span className="font-bold underline">123456</span> to pass verification.
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Digit fields */}
              <div className="flex justify-between gap-2.5 py-1">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-11 h-12 text-center text-lg font-bold border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-gray-800 bg-gray-50/50 focus:bg-white transition-all"
                  />
                ))}
              </div>

              <button 
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-[14px] hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-sm focus:ring-2 focus:ring-violet-500/20 outline-none flex items-center justify-center gap-2"
              >
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Verify code
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || otpResendCooldown > 0}
                  className={`text-xs font-semibold text-violet-600 hover:text-violet-500 disabled:text-gray-400`}
                >
                  {otpResendCooldown > 0 
                    ? `Didn't receive the code? Resend in ${otpResendCooldown}s` 
                    : "Didn't receive the code? Resend OTP"}
                </button>
              </div>

              <div className="pt-2 text-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setScreen('SIGNIN')}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD SCREEN */}
        {screen === 'DASHBOARD' && (
          <div className="animate-in fade-in duration-300">
            <ClipperHeader showStatusDot={true} />

            {/* Profile Bar */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-3.5 mb-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-violet-100" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center uppercase">
                    {user?.name?.slice(0, 2) || 'US'}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="font-semibold text-gray-800 text-[13px] leading-tight truncate">{user?.name || 'User Profile'}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex gap-1 shrink-0">
                <button 
                  onClick={() => setScreen('SETTINGS')}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleSignOut}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Save Clip Box */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-5">
              <div className="flex items-start gap-2.5 mb-3.5">
                <LinkIcon className="w-4 h-4 text-violet-500 shrink-0 mt-1" />
                <div className="overflow-hidden">
                  <p className="text-[13px] font-semibold text-gray-800 truncate leading-snug">{currentTitle || 'Loading current page...'}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{currentUrl}</p>
                </div>
              </div>

              {selectedText && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Selected Highlight</p>
                  <div className="bg-violet-50/50 border-l-2 border-violet-500 px-3 py-2 text-xs text-gray-600 rounded-r-lg max-h-20 overflow-y-auto italic">
                    "{selectedText}"
                  </div>
                </div>
              )}

              {saveStatus === 'idle' && (
                <button
                  onClick={handleSaveClip}
                  className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-[14px] hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-sm outline-none flex items-center justify-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  Save current page
                </button>
              )}

              {saveStatus === 'saving' && (
                <button
                  disabled
                  className="w-full py-2.5 bg-violet-400 text-white rounded-xl font-semibold text-[14px] outline-none flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving to Clipper...
                </button>
              )}

              {saveStatus === 'saved' && (
                <div className="space-y-3.5">
                  <div className="w-full py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    Saved successfully!
                  </div>

                  {savedClip && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-xs text-gray-600 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold text-gray-800 text-[11px] uppercase tracking-wide">AI Extract Preview</span>
                      </div>
                      
                      {savedClip.content_type && (
                        <p className="mb-1"><span className="font-semibold text-gray-700">Type:</span> {savedClip.content_type}</p>
                      )}
                      
                      {savedClip.summary && (
                        <p className="mb-2 leading-relaxed"><span className="font-semibold text-gray-700">Summary:</span> {savedClip.summary}</p>
                      )}

                      {savedClip.tags && savedClip.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {savedClip.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium text-[9px]">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {saveStatus === 'duplicate' && (
                <div className="space-y-3.5">
                  <div className="w-full py-2.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Already saved previously
                  </div>
                  
                  {savedClip && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-xs text-gray-600">
                      <p className="leading-relaxed">This URL was clipped on <span className="font-semibold">{new Date(savedClip.created_at || Date.now()).toLocaleDateString()}</span>. The backup is safely stored in your destinations.</p>
                    </div>
                  )}
                </div>
              )}

              {saveStatus === 'error' && (
                <div className="space-y-3.5">
                  <div className="w-full py-2.5 bg-red-50 border border-red-100 text-red-800 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Failed to save
                  </div>
                  <button
                    onClick={handleSaveClip}
                    className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-[14px] hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-sm outline-none flex items-center justify-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    Try saving again
                  </button>
                </div>
              )}
            </div>

            {/* Informational tips */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-[11px] text-gray-500 leading-normal">
              💡 <span className="font-medium text-gray-700">Quick tip:</span> Highlight any text on the webpage before clicking save to attach it to your clip as an AI context snippet.
            </div>
          </div>
        )}

        {/* SETTINGS SCREEN */}
        {screen === 'SETTINGS' && (
          <div className="animate-in fade-in duration-300">
            <ClipperHeader />

            <div className="mt-4 mb-5 flex items-center gap-2">
              <button 
                onClick={() => setScreen('DASHBOARD')}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Configuration Settings</h2>
            </div>

            <div className="space-y-5">
              {/* API settings */}
              <div className="space-y-3 border-b border-gray-100 pb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Backend Service URL</h3>
                <div>
                  <input 
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8000"
                    disabled={mockMode}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono outline-none focus:border-violet-500 transition-all disabled:opacity-50 disabled:bg-gray-50"
                  />
                  {!mockMode && (
                    <button
                      onClick={handleSaveApiUrl}
                      className="mt-2 text-xs font-semibold text-violet-600 hover:text-violet-500"
                    >
                      Save changes
                    </button>
                  )}
                </div>
              </div>

              {/* Mock mode toggle */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-700">Simulation (Mock Mode)</h3>
                  <p className="text-[10px] text-gray-400 leading-snug mt-0.5">Use simulated API responses. Great for demoing if the Django server is offline.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={mockMode} 
                    onChange={(e) => handleToggleMockMode(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>

              {/* Version details */}
              <div className="text-[10px] text-gray-400 bg-gray-50 rounded-lg p-3">
                <p><span className="font-semibold text-gray-600">App Name:</span> Clipper Extension</p>
                <p><span className="font-semibold text-gray-600">Stack:</span> React, TypeScript, WXT, Tailwind CSS</p>
                <p><span className="font-semibold text-gray-600">Version:</span> 1.0.0 (Production Mockup)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Screen Footer Auth links */}
      {(screen === 'SIGNIN' || screen === 'SIGNUP') && (
        <div className="pt-4 border-t border-gray-100 text-center text-xs mt-6 text-gray-500">
          {screen === 'SIGNIN' ? (
            <p>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setScreen('SIGNUP');
                  setError(null);
                }}
                className="font-semibold text-violet-600 hover:text-violet-500"
              >
                Create one
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setScreen('SIGNIN');
                  setError(null);
                }}
                className="font-semibold text-violet-600 hover:text-violet-500"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
