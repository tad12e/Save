// API Client for the Clipper extension

declare const chrome: any;

const DEFAULT_API_URL = 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_email_verified: boolean;
}
export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Clip {
  id: string;
  url: string;
  selected_text: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  duplicate: boolean;
  title?: string;
  content_type?: string;
  tags?: string[];
  summary?: string;
  created_at: string;
}

class ApiService {
  private baseUrl: string = DEFAULT_API_URL;
  private useMockMode: boolean = false;

  constructor() {
    // Load mock mode preference if stored
    if (typeof window !== 'undefined') {
      this.useMockMode = localStorage.getItem('clipper_mock_mode') === 'true';
      const storedUrl = localStorage.getItem('clipper_api_url');
      if (storedUrl) this.baseUrl = storedUrl;
    }
  }

  setMockMode(enabled: boolean) {
    this.useMockMode = enabled;
    localStorage.setItem('clipper_mock_mode', String(enabled));
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ clipper_mock_mode: String(enabled) });
    }
  }

  isMockMode() {
    return this.useMockMode;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    localStorage.setItem('clipper_api_url', url);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ clipper_api_url: url });
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (this.useMockMode) {
      return this.handleMockRequest<T>(endpoint, options);
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    // Add json content headers if there's a body
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Add authorization header if available
    const token = localStorage.getItem('clipper_access_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.status === 401) {
        // Expired/invalid JWT token — clear token
        this.logout();
        
        // If this was a save clip request, retry without expired Authorization header
        if (endpoint.includes('/api/clips/')) {
          const retryHeaders = new Headers(options.headers || {});
          if (options.body && !retryHeaders.has('Content-Type')) {
            retryHeaders.set('Content-Type', 'application/json');
          }
          retryHeaders.delete('Authorization');
          const retryRes = await fetch(url, { ...options, headers: retryHeaders });
          if (retryRes.ok) {
            return await retryRes.json() as T;
          }
        }
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'An unknown server error occurred' };
        }
        
        // Return structured error
        const errorMessage = typeof errorData === 'object' 
          ? Object.entries(errorData).map(([key, value]) => `${key}: ${value}`).join(', ')
          : 'Server returned an error';
          
        throw new Error(errorMessage || `Request failed with status ${response.status}`);
      }

      return await response.json() as T;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Network connection error
        throw new Error('ConnectionRefused: Failed to connect to the backend server. Please make sure the backend is running, or enable Mock Mode in the settings.');
      }
      throw error;
    }
  }

  // Simulated Mock Requests for demonstration
  private async handleMockRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Artificial latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const body = options.body ? JSON.parse(options.body as string) : {};

    if (endpoint.includes('/api/auth/signup/')) {
      if (body.email === 'error@example.com') {
        throw new Error('An account with this email already exists.');
      }
      return {
        message: 'Account created. Please verify your email with the OTP sent to your inbox.',
        email: body.email,
        pending_verification: true,
        verification_resent: false,
      } as unknown as T;
    }

    if (endpoint.includes('/api/auth/verify-otp/')) {
      if (body.otp !== '123456') {
        throw new Error('Invalid email or OTP.');
      }
      return {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: {
          id: 'mock-uuid-123456',
          email: body.email || 'user@example.com',
          name: 'Tadiwos Alemu',
          is_email_verified: true,
        }
      } as unknown as T;
    }

    if (endpoint.includes('/api/auth/resend-otp/')) {
      return {
        message: 'A new OTP has been sent to your email.',
        email: body.email,
      } as unknown as T;
    }

    if (endpoint.includes('/api/auth/signin/')) {
      if (body.password.length < 8) {
        throw new Error('Invalid email or password.');
      }
      return {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: {
          id: 'mock-uuid-123456',
          email: body.email,
          name: 'Tadiwos Alemu',
          is_email_verified: true,
        }
      } as unknown as T;
    }

    if (endpoint.includes('/api/auth/social/google/')) {
      return {
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user: {
          id: 'mock-uuid-google',
          email: 'google.user@example.com',
          name: 'Google User',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
          is_email_verified: true,
        }
      } as unknown as T;
    }

    if (endpoint.includes('/api/clips/')) {
      const isDuplicate = body.url.includes('duplicate');
      return {
        id: `clip-uuid-${Math.random().toString(36).substr(2, 9)}`,
        url: body.url,
        selected_text: body.selected_text || '',
        status: 'done',
        duplicate: isDuplicate,
        title: 'Clipper Web App Demo - Save Anything',
        content_type: 'Article',
        tags: ['technology', 'extension', 'wxt'],
        summary: 'This is a mocked summary of the saved page content created via the extension popup.',
        created_at: new Date().toISOString(),
      } as unknown as T;
    }

    throw new Error('Endpoint mock not implemented');
  }

  // Actual API operations
  async signup(data: any) {
    return this.request<any>('/api/auth/signup/', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        name: data.name,
        password: data.password,
        confirm_password: data.password, // map password to confirm_password
      }),
    });
  }

  async verifyOtp(email: string, otp: string) {
    const res = await this.request<AuthResponse>('/api/auth/verify-otp/', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    this.saveAuth(res);
    return res;
  }

  async resendOtp(email: string) {
    return this.request<any>('/api/auth/resend-otp/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async signin(data: any) {
    const res = await this.request<AuthResponse>('/api/auth/signin/', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });
    this.saveAuth(res);
    return res;
  }

  async googleAuth(accessToken: string) {
    const res = await this.request<AuthResponse>('/api/auth/social/google/', {
      method: 'POST',
      body: JSON.stringify({
        google_access_token: accessToken,
      }),
    });
    this.saveAuth(res);
    return res;
  }

  async getDestinations(): Promise<Destination[]> {
    try {
      const list = await this.request<any[]>('/api/destinations/');
      if (Array.isArray(list) && list.length > 0) {
        return list.map(d => ({
          id: String(d.id),
          name: d.name || d.provider,
          provider: d.provider,
          type: d.provider,
          is_default: Boolean(d.is_default),
          is_active: Boolean(d.is_active),
          connected: Boolean(d.is_active),
          config: d.config || {}
        })) as unknown as Destination[];
      }
    } catch (e) {
      console.warn('Failed to fetch destinations from Django backend:', e);
    }
    return [
      { id: 'custom_db', name: 'Save Vault (Internal Database)', provider: 'custom_db', type: 'custom_db', is_default: false, is_active: true, connected: true, config: {} },
      { id: 'google_sheets', name: 'Google Sheets', provider: 'google_sheets', type: 'google_sheets', is_default: true, is_active: true, connected: true, config: {} },
      { id: 'notion', name: 'Notion Workspace', provider: 'notion', type: 'notion', is_default: false, is_active: false, connected: false, config: {} }
    ] as unknown as Destination[];
  }

  async saveClip(url: string, selectedText: string = '', destinationId?: string | null) {
    const payload: any = { url, selected_text: selectedText };
    if (destinationId) {
      payload.destination_id = destinationId;
    }
    return this.request<Clip>('/api/clips/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  private saveAuth(res: AuthResponse) {
    localStorage.setItem('clipper_access_token', res.access);
    localStorage.setItem('clipper_refresh_token', res.refresh);
    localStorage.setItem('clipper_user', JSON.stringify(res.user));
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({
        clipper_access_token: res.access,
        clipper_refresh_token: res.refresh,
        clipper_user: JSON.stringify(res.user),
      });
    }
  }

  logout() {
    localStorage.removeItem('clipper_access_token');
    localStorage.removeItem('clipper_refresh_token');
    localStorage.removeItem('clipper_user');
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove(['clipper_access_token', 'clipper_refresh_token', 'clipper_user']);
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('clipper_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('clipper_access_token');
  }
}

export const api = new ApiService();
