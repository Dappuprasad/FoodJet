import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginPayload, RegisterPayload, User } from '@foodjet/shared';
import { api } from '../lib/api-client';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // No stored token means there is nothing to restore, so the probe below is
  // skipped and the app starts in its resolved signed-out state.
  const [isLoading, setIsLoading] = useState(() => Boolean(api.getAccessToken()));

  useEffect(() => {
    if (!api.getAccessToken()) return;

    let cancelled = false;

    // The stored access token may be expired; api.me() transparently attempts a
    // refresh first, so this doubles as session restoration on a cold load.
    void (async () => {
      try {
        const current = await api.me();
        if (!cancelled) setUser(current);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // The client owns token refresh; this is how it tells React the session is
    // finally gone so protected routes can bounce the user to the login page.
    api.setSessionExpiredHandler(() => setUser(null));
    return () => api.setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: signedIn } = await api.login(payload);
    setUser(signedIn);
    return signedIn;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: created } = await api.register(payload);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      // Clear locally even if the revoke call failed — the user asked to leave.
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
