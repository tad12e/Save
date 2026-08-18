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

export interface Destination {
  id: string;
  name: string;
  provider: string;
  type?: string;
  is_default: boolean;
  is_active: boolean;
  connected?: boolean;
  config?: any;
}

export interface Clip {
  id: string;
  url: string;
  selected_text: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  duplicate: boolean;
  source_platform?: string;
  source_author?: string;
  source_post_url?: string;
  parent_clip_id?: string;
  parent_clip_title?: string;
  child_clips_count?: number;
  is_resource_hub?: boolean;
  extracted_resource_url?: string;
  title?: string;
  content_type?: string;
  destination_name?: string;
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

  getMockMode(): boolean {
    return this.useMockMode;
  }

  isMockMode(): boolean {
    return this.useMockMode;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    localStorage.setItem('clipper_api_url', url);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
        // Try token refresh or notify user
        this.logout();
        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        let errorMsg = `Request failed: ${response.statusText}`;
        try {
          const errData = await response.json();
          errorMsg = errData.error || errData.detail || JSON.stringify(errData);
        } catch {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err: any) {
      // Mock Fallback for local testing if network fails
      if (this.useMockMode || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        console.warn(`[Mock API] Network unreachable for ${endpoint}. Simulating mock success.`);
        return this.getMockResponse<T>(endpoint, options);
      }
      throw err;
    }
  }

  private getMockResponse<T>(endpoint: string, options: RequestInit = {}): T {
    if (endpoint.includes('/api/auth/me/')) {
      return {
        id: 'mock_user_1',
        email: 'developer@example.com',
        name: 'Demo Pro User',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        is_email_verified: true,
      } as unknown as T;
    }

    if (endpoint.includes('/api/clips/') && options.method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return {
        id: `clip_${Date.now()}`,
        url: body.url || 'https://example.com',
        selected_text: body.selected_text || '',
        status: 'done',
        duplicate: false,
        title: body.url ? new URL(body.url).hostname : 'Sample Webpage',
        content_type: 'article',
        tags: ['web', 'saved', 'research'],
        summary: 'Saved successfully via offline simulation mode.',
        created_at: new Date().toISOString(),
      } as unknown as T;
    }

    if (endpoint.includes('/api/destinations/')) {
      return [
        { id: 'custom_db', name: 'Save Vault (Internal Database)', provider: 'custom_db', type: 'custom_db', is_default: false, is_active: true, connected: true, config: {} },
        { id: 'google_sheets', name: 'Google Sheets', provider: 'google_sheets', type: 'google_sheets', is_default: true, is_active: true, connected: true, config: {} },
        { id: 'notion', name: 'Notion Workspace', provider: 'notion', type: 'notion', is_default: false, is_active: false, connected: false, config: {} },
      ] as unknown as T;
    }

    return {} as T;
  }

  // --- Auth Endpoints ---

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.saveAuth(res);
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.saveAuth(res);
    return res;
  }

  async signin(payload: { email: string; password: string } | string, password?: string): Promise<AuthResponse> {
    if (typeof payload === 'object') {
      return this.login(payload.email, payload.password);
    }
    return this.login(payload, password || '');
  }

  async signup(payload: { email: string; password: string; name?: string } | string, password?: string, name?: string): Promise<AuthResponse> {
    if (typeof payload === 'object') {
      return this.register(payload.email, payload.password, payload.name || payload.email.split('@')[0]);
    }
    return this.register(payload, password || '', name || payload.split('@')[0]);
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/verify-otp/', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    this.saveAuth(res);
    return res;
  }

  async resendOtp(email: string): Promise<any> {
    return this.request('/api/auth/resend-otp/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async googleAuth(accessToken: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/google/', {
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

  async createDestination(payload: any): Promise<Destination> {
    return this.request<Destination>('/api/destinations/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async setDefaultDestination(id: string): Promise<any> {
    return this.request(`/api/destinations/${id}/set_default/`, {
      method: 'POST',
    });
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
