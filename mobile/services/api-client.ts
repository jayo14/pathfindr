import { jwtDecode } from 'jwt-decode';
import { getToken, setToken, TOKEN_KEYS } from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function isTokenExpired(token: string): Promise<boolean> {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp * 1000 < Date.now() + 30000; // 30s buffer
  } catch { return true; }
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let token = await getToken(TOKEN_KEYS.ACCESS);

  // Proactive expiry check
  if (token && await isTokenExpired(token) && endpoint !== '/auth/login/' && endpoint !== '/auth/refresh/') {
    const refreshToken = await getToken(TOKEN_KEYS.REFRESH);
    if (refreshToken) {
      if (isRefreshing) {
        token = await new Promise((resolve) => {
          refreshQueue.push((newToken) => resolve(newToken));
        });
      } else {
        isRefreshing = true;
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            await setToken(TOKEN_KEYS.ACCESS, data.access);
            token = data.access;
            refreshQueue.forEach(cb => cb(data.access));
          } else {
            token = null;
            refreshQueue.forEach(cb => cb(''));
          }
        } catch {
          token = null;
          refreshQueue.forEach(cb => cb(''));
        } finally {
          isRefreshing = false;
          refreshQueue = [];
        }
      }
    }
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (options.params) {
    Object.keys(options.params).forEach(key => url.searchParams.append(key, options.params![key]));
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (response.status === 401 && endpoint !== '/auth/login/' && endpoint !== '/auth/refresh/') {
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push(async (newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          resolve(fetch(url.toString(), { ...options, headers }).then(r => r.json()));
        });
      });
    }

    isRefreshing = true;
    const refreshToken = await getToken(TOKEN_KEYS.REFRESH);
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          await setToken(TOKEN_KEYS.ACCESS, data.access);
          refreshQueue.forEach(cb => cb(data.access));
          return apiRequest<T>(endpoint, options);
        } else {
          refreshQueue.forEach(cb => cb(''));
        }
      } catch {
        refreshQueue.forEach(cb => cb(''));
      } finally {
        isRefreshing = false;
        refreshQueue = [];
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'API Request failed');
  }

  return response.json() as Promise<T>;
}
