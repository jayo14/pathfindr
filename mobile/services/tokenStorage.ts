/**
 * tokenStorage — thin wrapper around expo-secure-store (iOS/Android) with an
 * AsyncStorage fallback for web, where SecureStore is unavailable.
 *
 * All token read/write operations should go through this module so that the
 * storage backend can be swapped without touching call sites.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IS_WEB = Platform.OS === 'web';

export const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;

type TokenKey = (typeof TOKEN_KEYS)[keyof typeof TOKEN_KEYS];

/**
 * Retrieve a stored token. Returns null if the key does not exist or on error.
 */
export async function getToken(key: TokenKey): Promise<string | null> {
  try {
    if (IS_WEB) {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

/**
 * Persist a token. Overwrites any existing value for the same key.
 */
export async function setToken(key: TokenKey, value: string): Promise<void> {
  if (IS_WEB) {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

/**
 * Delete a single token.
 */
export async function clearToken(key: TokenKey): Promise<void> {
  try {
    if (IS_WEB) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    // Ignore — key may not exist
  }
}

/**
 * Delete both access and refresh tokens in one call (used by logout).
 */
export async function clearAllTokens(): Promise<void> {
  await Promise.all([
    clearToken(TOKEN_KEYS.ACCESS),
    clearToken(TOKEN_KEYS.REFRESH),
  ]);
}
