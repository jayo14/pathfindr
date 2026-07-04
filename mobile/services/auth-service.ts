import { apiRequest } from "./api-client";
import { getToken, setToken, clearAllTokens, TOKEN_KEYS } from "./tokenStorage";

// ── Types ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  fullName?: string;
  full_name?: string;
  isStudent?: boolean;
  is_student?: boolean;
  college?: string;
  department?: string;
  yearOfStudy?: string;
  year_of_study?: string;
  preferences?: Record<string, unknown>;
  hasCompletedOnboarding?: boolean;
  has_completed_onboarding?: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  profile: UserProfile;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Persist both tokens returned by login/register responses. */
export async function saveTokensFromResponse(
  data: Pick<AuthResponse, "access" | "refresh">,
): Promise<void> {
  await Promise.all([
    setToken(TOKEN_KEYS.ACCESS, data.access),
    setToken(TOKEN_KEYS.REFRESH, data.refresh),
  ]);
}

// ── Auth actions ──────────────────────────────────────────────────────────

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<void> {
  await apiRequest("/auth/register/", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  await saveTokensFromResponse(data);
  return data;
}

export async function logout(): Promise<void> {
  await clearAllTokens();
}

/** GET /auth/me/ — returns the currently authenticated user + profile. */
export async function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me/");
}

/**
 * POST /auth/change-password/
 * Throws on incorrect old password or validation errors.
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await apiRequest("/auth/change-password/", {
    method: "POST",
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest("/auth/password-reset-request/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getStoredTokens(): Promise<{
  access: string | null;
  refresh: string | null;
}> {
  const [access, refresh] = await Promise.all([
    getToken(TOKEN_KEYS.ACCESS),
    getToken(TOKEN_KEYS.REFRESH),
  ]);
  return { access, refresh };
}
