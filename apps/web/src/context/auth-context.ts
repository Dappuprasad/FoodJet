import { createContext, useContext } from 'react';
import type { LoginPayload, RegisterPayload, User } from '@foodjet/shared';

export interface AuthContextValue {
  user: User | null;
  /** True until the initial session probe finishes. */
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
