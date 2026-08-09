/* ══════════════════════════════════════════════════════════════
   CLIPPER AUTHENTICATION API CLIENT
   ══════════════════════════════════════════════════════════════ */

const API_BASE_URL = 'http://localhost:8000/api';

export const AuthState = {
  getAccessToken() {
    return localStorage.getItem('clipper_access_token');
  },
  getRefreshToken() {
    return localStorage.getItem('clipper_refresh_token');
  },
  getUser() {
    const raw = localStorage.getItem('clipper_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setSession(tokens, user) {
    if (tokens.access) localStorage.setItem('clipper_access_token', tokens.access);
    if (tokens.refresh) localStorage.setItem('clipper_refresh_token', tokens.refresh);
    if (user) localStorage.setItem('clipper_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('clipper_access_token');
    localStorage.removeItem('clipper_refresh_token');
    localStorage.removeItem('clipper_user');
  },
  isAuthenticated() {
    return Boolean(this.getAccessToken());
  }
};

/**
  * Helper for API requests
  */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = AuthState.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = data.detail || data.message;
    if (!errorMsg && typeof data === 'object') {
      const firstVal = Object.values(data)[0];
      if (Array.isArray(firstVal)) {
        errorMsg = firstVal.join(', ');
      } else if (typeof firstVal === 'string') {
        errorMsg = firstVal;
      }
    }
    if (!errorMsg) errorMsg = 'An unexpected error occurred. Please try again.';

    const error = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/* ── API CALLS ────────────────────────────────────────────────── */

export async function signup({ email, name, password, confirm_password }) {
  return await apiRequest('/auth/signup/', {
    method: 'POST',
    body: JSON.stringify({ email, name, password, confirm_password })
  });
}

export async function verifyOTP({ email, otp }) {
  const data = await apiRequest('/auth/verify-otp/', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  });
  if (data.access && data.user) {
    AuthState.setSession({ access: data.access, refresh: data.refresh }, data.user);
  }
  return data;
}

export async function resendOTP({ email }) {
  return await apiRequest('/auth/resend-otp/', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function signin({ email, password }) {
  const data = await apiRequest('/auth/signin/', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (data.access && data.user) {
    AuthState.setSession({ access: data.access, refresh: data.refresh }, data.user);
  }
  return data;
}

export async function googleAuth({ google_access_token }) {
  const data = await apiRequest('/auth/social/google/', {
    method: 'POST',
    body: JSON.stringify({ google_access_token })
  });
  if (data.access && data.user) {
    AuthState.setSession({ access: data.access, refresh: data.refresh }, data.user);
  }
  return data;
}

export async function fetchMe() {
  const user = await apiRequest('/auth/me/');
  if (user) {
    localStorage.setItem('clipper_user', JSON.stringify(user));
  }
  return user;
}

export function logout() {
  AuthState.clearSession();
  window.location.reload();
}

