import { apiRequest } from './api-client';
import {
  getToken,
  setToken,
  clearAllTokens,
  TOKEN_KEYS,
} from './tokenStorage';

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    profile: {
      full_name: string;
      is_student: boolean;
      has_completed_onboarding: boolean;
    };
  };
}

export async function register(username: string, email: string, password: string): Promise<void> {
  await apiRequest('/auth/register/', { method: 'POST', body: JSON.stringify({ username, email, password }) });
}

export async function login(username: string, password: string): Promise<{ access: string; refresh: string; user: any }> {
  const data = await apiRequest<{ access: string; refresh: string; user: any }>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  await setToken(TOKEN_KEYS.ACCESS, data.access);
  await setToken(TOKEN_KEYS.REFRESH, data.refresh);
  return data;
}

export async function logout(): Promise<void> {
  await clearAllTokens();
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest('/auth/password-reset-request/', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function getStoredTokens(): Promise<{ access: string | null; refresh: string | null }> {
  const [access, refresh] = await Promise.all([
    getToken(TOKEN_KEYS.ACCESS),
    getToken(TOKEN_KEYS.REFRESH),
  ]);
  return { access, refresh };
}
