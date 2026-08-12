export interface AuthorizeParams {
  provider: string;
  name: string;
  accessType: 'full' | 'partial';
  actionType: 'create' | 'existing';
  targetResourceName: string;
  accountEmail?: string;
}

export interface AuthorizeResponse {
  status: string;
  provider: string;
  access_type: 'full' | 'partial';
  granted_scopes: string[];
  target_resource_name: string;
  auth_url?: string | null;
  is_real_oauth?: boolean;
  destination: any;
}

const BASE_URL = 'http://localhost:8000';

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('clipper_access_token');
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function authorizeDestinationBackend(params: AuthorizeParams): Promise<AuthorizeResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/authorize/`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        provider: params.provider,
        name: params.name,
        access_type: params.accessType,
        action_type: params.actionType,
        target_resource_name: params.targetResourceName,
        account_email: params.accountEmail,
      }),
    });
    if (!response.ok) {
      return {
        status: 'authorized',
        provider: params.provider,
        access_type: params.accessType,
        granted_scopes: ['read', 'write'],
        target_resource_name: params.targetResourceName,
        is_real_oauth: false,
        destination: null,
      };
    }
    return await response.json();
  } catch (error) {
    console.warn('Could not authorize destination on backend:', error);
    return {
      status: 'authorized',
      provider: params.provider,
      access_type: params.accessType,
      granted_scopes: ['read', 'write'],
      target_resource_name: params.targetResourceName,
      is_real_oauth: false,
      destination: null,
    };
  }
}

export async function createClipBackend(clipData: { url: string; selected_text?: string; destination_id?: string; is_privacy_mode?: boolean }) {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'X-Privacy-Mode': clipData.is_privacy_mode ? 'true' : 'false',
      }),
      body: JSON.stringify({
        url: clipData.url,
        selected_text: clipData.selected_text || '',
        destination_id: clipData.destination_id,
        privacy_mode: clipData.is_privacy_mode || false,
      }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not post clip to backend:', error);
    return null;
  }
}

export async function fetchDestinationsBackend() {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not fetch destinations from backend:', error);
    return null;
  }
}

export async function setDefaultDestinationBackend(destinationId: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/set-default/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not set default destination on backend:', error);
    return null;
  }
}

export async function testDestinationBackend(destinationId: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/test/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not test destination on backend:', error);
    return null;
  }
}

export async function updateDestinationBackend(destinationId: string, data: any) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not update destination on backend:', error);
    return null;
  }
}

export async function deleteDestinationBackend(destinationId: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.warn('Could not delete destination on backend:', error);
    return false;
  }
}

// User Authentication Backend APIs (Calls exact same Django views as Extension)
async function parseJsonResponse(response: Response, defaultErrMsg: string) {
  const text = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    if (!response.ok) {
      throw new Error(`Server Error (${response.status}: ${response.statusText}). Check backend status.`);
    }
  }

  if (!response.ok) {
    const msg = typeof data === 'object' && data !== null
      ? Object.values(data).flat().join(', ')
      : defaultErrMsg;
    throw new Error(msg || defaultErrMsg);
  }
  return data;
}

export async function signupBackend(data: { email: string; password: string; name: string }) {
  const response = await fetch(`${BASE_URL}/api/auth/signup/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await parseJsonResponse(response, 'Signup failed');
}

export async function signinBackend(data: { email: string; password: string }) {
  const response = await fetch(`${BASE_URL}/api/auth/signin/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await parseJsonResponse(response, 'Invalid credentials');
}

export async function verifyOTPBackend(data: { email: string; otp: string }) {
  const response = await fetch(`${BASE_URL}/api/auth/verify-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await parseJsonResponse(response, 'OTP verification failed');
}

export async function resendOTPBackend(email: string) {
  const response = await fetch(`${BASE_URL}/api/auth/resend-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return await parseJsonResponse(response, 'Resend OTP failed');
}

export async function googleAuthBackend(idToken: string) {
  const response = await fetch(`${BASE_URL}/api/auth/social/google/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  return await parseJsonResponse(response, 'Google Auth failed');
}

