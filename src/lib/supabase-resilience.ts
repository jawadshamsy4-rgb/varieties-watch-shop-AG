import { supabase } from "@/integrations/supabase/client";

type MaybeSessionError = {
  code?: string;
  message?: string;
  status?: number;
};

const SESSION_ERROR_CODES = new Set(["PGRST301"]);
const SESSION_ERROR_PATTERNS = [
  /jwt/i,
  /refresh token/i,
  /auth session missing/i,
  /invalid claim/i,
  /session has expired/i,
  /user from sub claim in jwt/i,
];

const clearStorageKeys = (storage: Storage | undefined) => {
  if (!storage) return;

  Object.keys(storage).forEach((key) => {
    if (key.startsWith("sb-") || key.includes("supabase.auth.token")) {
      storage.removeItem(key);
    }
  });
};

/**
 * Inspect persisted Supabase auth tokens and remove any that are clearly
 * expired or malformed. Browsers that have an old token sitting in
 * localStorage can otherwise cause auth/getSession + subsequent queries to
 * hang or fail silently, leaving the UI stuck on a loading state. Incognito
 * works because there is no stale token to begin with.
 */
export const purgeStaleAuthTokens = () => {
  if (typeof window === "undefined") return;

  const storages: Storage[] = [];
  try { if (window.localStorage) storages.push(window.localStorage); } catch {}
  try { if (window.sessionStorage) storages.push(window.sessionStorage); } catch {}

  const nowSec = Math.floor(Date.now() / 1000);

  for (const storage of storages) {
    let keys: string[] = [];
    try { keys = Object.keys(storage); } catch { continue; }

    for (const key of keys) {
      if (!key.startsWith("sb-") && !key.includes("supabase.auth.token")) continue;

      let raw: string | null = null;
      try { raw = storage.getItem(key); } catch { continue; }
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        const expiresAt: number | undefined =
          parsed?.expires_at ??
          parsed?.currentSession?.expires_at ??
          parsed?.session?.expires_at;

        // If we can read an expiry and it's in the past (with 60s grace),
        // the token is stale — drop it so the SDK starts clean.
        if (typeof expiresAt === "number" && expiresAt + 60 < nowSec) {
          storage.removeItem(key);
        }
      } catch {
        // Malformed entry — safer to remove than to keep around.
        try { storage.removeItem(key); } catch {}
      }
    }
  }
};

export const isSessionError = (error: unknown) => {
  const sessionError = error as MaybeSessionError | null;
  if (!sessionError) return false;

  if (typeof sessionError.code === "string" && SESSION_ERROR_CODES.has(sessionError.code)) {
    return true;
  }

  if (sessionError.status === 401 || sessionError.status === 403) {
    return true;
  }

  if (typeof sessionError.message === "string") {
    return SESSION_ERROR_PATTERNS.some((pattern) => pattern.test(sessionError.message));
  }

  return false;
};

export const resetClientSession = async () => {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Ignore sign-out failures and clear client storage directly.
  }

  if (typeof window === "undefined") return;

  clearStorageKeys(window.localStorage);
  clearStorageKeys(window.sessionStorage);
};

export const ensureFreshSession = async () => {
  // No-op. The Supabase SDK auto-refreshes tokens on its own. Calling
  // getSession() here was hanging on browsers with corrupted localStorage
  // tokens, which blocked every data query behind it.
  return;
};

export const runWithSessionRecovery = async <T>(queryFn: () => Promise<T>) => {
  try {
    return await queryFn();
  } catch (error) {
    if (!isSessionError(error)) throw error;

    await resetClientSession();
    return await queryFn();
  }
};

export const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 30000, message = "Request timed out") => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};