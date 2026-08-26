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
import { api, User, Clip, Destination } from '../../utils/api';
import './App.css';

declare const chrome: any;

type Screen = 'SIGNIN' | 'SIGNUP' | 'OTP_VERIFY' | 'DASHBOARD' | 'SETTINGS';

const getGoogleAccessToken = () => {
  const manifest = chrome?.runtime?.getManifest?.();
  const clientId = manifest?.oauth2?.client_id;

  if (!chrome?.identity?.getAuthToken) {
    throw new Error('Chrome identity API is not available. Load this as a Chrome extension.');
  }

  if (!clientId) {
    throw new Error('Missing GOOGLE_CLIENT_ID. Add it to .env, rebuild, and reload the extension.');
  }

  return new Promise<string>((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token: string) => {
      const message = chrome.runtime?.lastError?.message;
      if (message) {
        reject(new Error(message));
        return;
      }

      if (!token) {
        reject(new Error('Google did not return an access token.'));
        return;
      }

      resolve(token);
    });
  });
};

const handleAutoFill = (setter: (val: string) => void) => (e: React.AnimationEvent<HTMLInputElement>) => {
  if (e.animationName === 'onAutoFillStart' && e.currentTarget.value) {
    setter(e.currentTarget.value);
  }
};

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
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [newDestinationProvider, setNewDestinationProvider] = useState<'notion' | 'google_sheets'>('notion');
  const [newDestinationName, setNewDestinationName] = useState('');
  const [notionToken, setNotionToken] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [createNewNotion, setCreateNewNotion] = useState(true);
  const [notionParentPageId, setNotionParentPageId] = useState('');
  const [sheetsToken, setSheetsToken] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [createNewSheet, setCreateNewSheet] = useState(true);
  const [sheetName, setSheetName] = useState('Clips');

  // Category routing & Music settings state
  const [categoryRules, setCategoryRules] = useState<Record<string, string>>({});
  const [selectedMusicProvider, setSelectedMusicProvider] = useState<'spotify' | 'youtube_music'>('spotify');
  const [selectedMusicPlaylist, setSelectedMusicPlaylist] = useState<string>('default');

  const loadDestinations = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(
          ['category_rules', 'music_default_provider', 'music_default_playlist'],
          (res: any) => {
            if (res.category_rules) setCategoryRules(res.category_rules);
            if (res.music_default_provider) setSelectedMusicProvider(res.music_default_provider);
            if (res.music_default_playlist) setSelectedMusicPlaylist(res.music_default_playlist);
          }
        );
      }
      const items = await api.getDestinations();
      setDestinations(items);
      const defaultDestination = items.find((item) => item.is_default);
      const storedId = localStorage.getItem('clipper_last_destination_id');
      const storedMatch = items.find((item) => item.id === storedId);
      // Prioritize default destination set in Web App
      setSelectedDestinationId(defaultDestination?.id || storedMatch?.id || items[0]?.id || '');
    } catch {
      setDestinations([]);
      setSelectedDestinationId('');
    }
  };

  // Initialize
  useEffect(() => {
    const initApp = async () => {
      // Sync chrome.storage.local to window.localStorage in extension popup context
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await new Promise<void>((resolve) => {
          chrome.storage.local.get(['clipper_access_token', 'clipper_refresh_token', 'clipper_user'], (result: any) => {
            if (result?.clipper_access_token) {
              localStorage.setItem('clipper_access_token', result.clipper_access_token);
            }
            if (result?.clipper_refresh_token) {
              localStorage.setItem('clipper_refresh_token', result.clipper_refresh_token);
            }
            if (result?.clipper_user) {
              localStorage.setItem('clipper_user', result.clipper_user);
            }
            resolve();
          });
        });
      }

      setMockMode(api.isMockMode());
      setApiUrl(api.getBaseUrl());

      const currentUser = api.getCurrentUser();
      const token = api.getAccessToken();

      if (currentUser && token) {
        setUser(currentUser);
        setScreen('DASHBOARD');
        await loadDestinations();
      } else {
        setScreen('SIGNIN');
      }
    };

    initApp();

    // Get current tab details if in extension context
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const activeTab = tabs?.[0];
        if (activeTab) {
          setCurrentUrl(activeTab.url || '');
          setCurrentTitle(activeTab.title || '');

          // Try to get selected text if not on restricted browser pages (e.g. chrome://)
          if (activeTab.id && activeTab.url && !activeTab.url.startsWith('chrome://') && !activeTab.url.startsWith('edge://') && !activeTab.url.startsWith('about:')) {
            try {
              chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: () => window.getSelection()?.toString() || '',
              }, (results: any[]) => {
                if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
                  // Silently ignore restricted page warnings
                  return;
                }
                if (results && results[0] && results[0].result) {
                  setSelectedText(results[0].result);
                }
              });
            } catch {
              // Ignore scripting restrictions
            }
          }
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
        try {
          await api.resendOtp(email);
          setSuccess('Verification pending. We sent a new code.');
          setOtpResendCooldown(60);
        } catch (resendError: any) {
          setError(
            resendError.message ||
              'Verification pending, but we could not send a new code. Please try again later.'
          );
        }
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

  // Google OAuth Auth
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const googleAccessToken = api.isMockMode()
        ? 'google_mock_access_token_123456'
        : await getGoogleAccessToken();
      const res = await api.googleAuth(googleAccessToken);
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
      const res = await api.saveClip(currentUrl, selectedText, selectedDestinationId || null);
      if (selectedDestinationId) {
        localStorage.setItem('clipper_last_destination_id', selectedDestinationId);
      }
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

  const handleQuickSaveToProvider = async (provider: 'google_sheets' | 'notion' | 'spotify') => {
    setSaveStatus('saving');
    setError(null);

    try {
      const match = destinations.find((d) => d.provider === provider);
      const destId = match ? match.id : null;
      const res = await api.saveClip(currentUrl, selectedText, destId);
      setSavedClip(res);
      if (res.duplicate) {
        setSaveStatus('duplicate');
      } else {
        setSaveStatus('saved');
      }
    } catch (err: any) {
      setError(err.message || `Failed to save to ${provider}.`);
      setSaveStatus('error');
    }
  };

  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const config =
        newDestinationProvider === 'notion'
          ? createNewNotion
            ? {
                integration_token: notionToken,
                parent_page_id: notionParentPageId,
                create_new: true,
              }
            : {
                integration_token: notionToken,
                database_id: notionDatabaseId,
              }
          : createNewSheet
            ? {
                access_token: sheetsToken,
                create_new: true,
                sheet_name: sheetName || 'Clips',
              }
            : {
                access_token: sheetsToken,
                spreadsheet_id: spreadsheetId,
                sheet_name: sheetName || 'Clips',
              };

      await api.createDestination({
        provider: newDestinationProvider,
        name: newDestinationName || (newDestinationProvider === 'notion' ? 'Notion Workspace' : 'Google Sheets'),
        config,
        is_default: destinations.length === 0,
      });

      setSuccess('Destination connected successfully.');
      setNewDestinationName('');
      setNotionToken('');
      setNotionDatabaseId('');
      setNotionParentPageId('');
      setSheetsToken('');
      setSpreadsheetId('');
      await loadDestinations();
    } catch (err: any) {
      setError(err.message || 'Failed to create destination.');
    } finally {
      setIsLoading(false);
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
                <label htmlFor="signin-email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
                <input 
                  type="email"
                  id="signin-email"
                  name="email"
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  onAnimationStart={handleAutoFill(setEmail)}
                  onBlur={(e) => {
                    if (e.currentTarget.value && e.currentTarget.value !== email) {
                      setEmail(e.currentTarget.value);
                    }
                  }}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-[14px] text-gray-800 transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={passwordVisible ? 'text' : 'password'}
                    id="signin-password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    onAnimationStart={handleAutoFill(setPassword)}
                    onBlur={(e) => {
                      if (e.currentTarget.value && e.currentTarget.value !== password) {
                        setPassword(e.currentTarget.value);
                      }
                    }}
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
                <label htmlFor="signup-name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Full name</label>
                <input 
                  type="text"
                  id="signup-name"
                  name="name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onInput={(e) => setFullName(e.currentTarget.value)}
                  onAnimationStart={handleAutoFill(setFullName)}
                  onBlur={(e) => {
                    if (e.currentTarget.value && e.currentTarget.value !== fullName) {
                      setFullName(e.currentTarget.value);
                    }
                  }}
                  placeholder="Tadiwos Alemu"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-[14px] text-gray-800 transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
                <input 
                  type="email"
                  id="signup-email"
                  name="email"
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  onAnimationStart={handleAutoFill(setEmail)}
                  onBlur={(e) => {
                    if (e.currentTarget.value && e.currentTarget.value !== email) {
                      setEmail(e.currentTarget.value);
                    }
                  }}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none text-[14px] text-gray-800 transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={passwordVisible ? 'text' : 'password'}
                    id="signup-password"
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    onAnimationStart={handleAutoFill(setPassword)}
                    onBlur={(e) => {
                      if (e.currentTarget.value && e.currentTarget.value !== password) {
                        setPassword(e.currentTarget.value);
                      }
                    }}
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
                  onClick={() => {
                    setScreen('SETTINGS');
                    loadDestinations();
                  }}
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

              <div className="mb-3">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Destination</label>
                <select
                  value={selectedDestinationId}
                  onChange={(e) => {
                    setSelectedDestinationId(e.target.value);
                    localStorage.setItem('clipper_last_destination_id', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-800 outline-none focus:border-violet-500 font-medium"
                >
                  {destinations.length === 0 ? (
                    <option value="">🟡 Save Vault (Internal Database)</option>
                  ) : (
                    destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.is_default ? '★ Default: ' : ''}{destination.name} ({destination.provider === 'notion' ? 'Notion' : destination.provider === 'google_sheets' ? 'Google Sheets' : 'Internal DB'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {saveStatus === 'idle' && (
                <>
                  <button
                    onClick={handleSaveClip}
                    className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-[14px] hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-sm outline-none flex items-center justify-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    Save current page
                  </button>

                  {/* 1-Tap Quick Destination Buttons */}
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickSaveToProvider('google_sheets')}
                      className="flex-1 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <span>📊</span>
                      <span>Save to Sheets</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSaveToProvider('notion')}
                      className="flex-1 py-2 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <span>📝</span>
                      <span>Save to Notion</span>
                    </button>
                  </div>
                </>
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
                    Saved — processing in background
                  </div>

                  {savedClip && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-xs text-gray-600 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold text-gray-800 text-[11px] uppercase tracking-wide">Background job queued</span>
                      </div>
                      <p className="leading-relaxed">
                        Clipper will summarize this page and export it to{' '}
                        <span className="font-semibold">{savedClip.destination_name || 'your default destination'}</span>.
                      </p>
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

              <div className="space-y-4 border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Destinations</h3>
                  <button
                    type="button"
                    onClick={loadDestinations}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-500"
                  >
                    Refresh
                  </button>
                </div>

                {destinations.length > 0 ? (
                  <div className="space-y-2">
                    {destinations.map((destination) => (
                      <div key={destination.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{destination.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {destination.provider === 'notion' ? 'Notion' : 'Google Sheets'}
                            {destination.is_default ? ' • default' : ''}
                          </p>
                        </div>
                        {!destination.is_default ? (
                          <button
                            type="button"
                            onClick={async () => {
                              await api.setDefaultDestination(destination.id);
                              await loadDestinations();
                            }}
                            className="text-[10px] font-semibold text-violet-600"
                          >
                            Set default
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500">No destinations connected yet.</p>
                )}

                <form onSubmit={handleCreateDestination} className="space-y-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-700">Connect a destination</p>
                  <select
                    value={newDestinationProvider}
                    onChange={(e) => setNewDestinationProvider(e.target.value as 'notion' | 'google_sheets')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                  >
                    <option value="notion">Notion</option>
                    <option value="google_sheets">Google Sheets</option>
                  </select>
                  <input
                    type="text"
                    value={newDestinationName}
                    onChange={(e) => setNewDestinationName(e.target.value)}
                    placeholder="Destination name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                    required
                  />
                  {newDestinationProvider === 'notion' ? (
                    <>
                      <input
                        type="password"
                        value={notionToken}
                        onChange={(e) => setNotionToken(e.target.value)}
                        placeholder="Notion integration token"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                        required
                      />
                      <label className="flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createNewNotion}
                          onChange={(e) => setCreateNewNotion(e.target.checked)}
                          className="rounded text-violet-600 focus:ring-violet-500"
                        />
                        ✨ Auto-create new Notion Database
                      </label>
                      {createNewNotion ? (
                        <input
                          type="text"
                          value={notionParentPageId}
                          onChange={(e) => setNotionParentPageId(e.target.value)}
                          placeholder="Notion Parent Page ID"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          value={notionDatabaseId}
                          onChange={(e) => setNotionDatabaseId(e.target.value)}
                          placeholder="Existing Notion Database ID"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                          required
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="password"
                        value={sheetsToken}
                        onChange={(e) => setSheetsToken(e.target.value)}
                        placeholder="Google OAuth access token"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                        required
                      />
                      <label className="flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createNewSheet}
                          onChange={(e) => setCreateNewSheet(e.target.checked)}
                          className="rounded text-violet-600 focus:ring-violet-500"
                        />
                        ✨ Auto-create brand new Google Sheet
                      </label>
                      {!createNewSheet ? (
                        <input
                          type="text"
                          value={spreadsheetId}
                          onChange={(e) => setSpreadsheetId(e.target.value)}
                          placeholder="Existing Google Spreadsheet ID"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                          required
                        />
                      ) : null}
                      <input
                        type="text"
                        value={sheetName}
                        onChange={(e) => setSheetName(e.target.value)}
                        placeholder="Sheet tab name (default: Clips)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none"
                      />
                    </>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Save destination
                  </button>
                </form>
              </div>

              {/* Category Routing Rules */}
              <div className="space-y-3.5 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-700">Category Routing Defaults</h3>
                  <p className="text-[10px] text-gray-400 leading-snug mt-0.5">
                    Set specific destinations per content type. If not configured, clips will automatically go to your <strong>Universal Default Destination</strong>.
                  </p>
                </div>

                <div className="space-y-2.5 bg-gray-50 border border-gray-100 rounded-xl p-3">
                  {/* Articles / Blogs */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">📰 Articles & Blogs</label>
                    <select
                      value={categoryRules['article'] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = { ...categoryRules, article: val };
                        setCategoryRules(updated);
                        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                          chrome.storage.local.set({ category_rules: updated });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                    >
                      <option value="">🌐 Universal Default Destination</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.provider === 'notion' ? 'Notion' : 'Google Sheets'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jobs & Opportunities */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">💼 Jobs & Opportunities</label>
                    <select
                      value={categoryRules['job'] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = { ...categoryRules, job: val };
                        setCategoryRules(updated);
                        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                          chrome.storage.local.set({ category_rules: updated });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                    >
                      <option value="">🌐 Universal Default Destination</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.provider === 'notion' ? 'Notion' : 'Google Sheets'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tools & GitHub Repos */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">🛠️ Tools & Repos</label>
                    <select
                      value={categoryRules['tool'] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = { ...categoryRules, tool: val };
                        setCategoryRules(updated);
                        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                          chrome.storage.local.set({ category_rules: updated });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                    >
                      <option value="">🌐 Universal Default Destination</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.provider === 'notion' ? 'Notion' : 'Google Sheets'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Music (Spotify / YouTube Music) */}
                  <div className="pt-2 border-t border-gray-200/70">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      🎵 Music & Songs (Always Dedicated Music Destination)
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <select
                        value={selectedMusicProvider}
                        onChange={(e) => {
                          const val = e.target.value as 'spotify' | 'youtube_music';
                          setSelectedMusicProvider(val);
                          if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                            chrome.storage.local.set({ music_default_provider: val });
                          }
                        }}
                        className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                      >
                        <option value="spotify">Spotify</option>
                        <option value="youtube_music">YouTube Music</option>
                      </select>
                      <select
                        value={selectedMusicPlaylist}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedMusicPlaylist(val);
                          if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                            chrome.storage.local.set({ music_default_playlist: val });
                          }
                        }}
                        className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                      >
                        <option value="default">🎧 Clipper Tracks (Default)</option>
                        <option value="liked">❤️ Liked Songs</option>
                        <option value="focus">💻 Coding & Focus</option>
                        <option value="favorites">⭐ Favorites</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-snug">
                      When saving music, you can pick any playlist or save instantly into your default playlist.
                    </p>
                  </div>
                </div>
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
