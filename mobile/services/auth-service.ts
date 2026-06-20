import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api-client';

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
  await AsyncStorage.setItem('access_token', data.access);
  await AsyncStorage.setItem('refresh_token', data.refresh);
  return data;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest('/auth/password-reset-request/', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function getStoredTokens(): Promise<{ access: string | null; refresh: string | null }> {
  const [access, refresh] = await AsyncStorage.multiGet(['access_token', 'refresh_token']);
  return { access: access[1], refresh: refresh[1] };
}
