import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AuthModal } from '@/components/auth/AuthModal';
import { useProjectStore } from '@/store/projectStore';

export interface AuthUser {
  id: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  authLoading: boolean;
  /** False when the backend has no KV attached — hide all auth UI. */
  authAvailable: boolean;
  authModal: null | 'login' | 'signup';
  openAuth: (mode: 'login' | 'signup') => void;
  closeAuth: () => void;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authAvailable, setAuthAvailable] = useState(true);
  const [authModal, setAuthModal] = useState<null | 'login' | 'signup'>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.status === 503) {
          if (!cancelled) setAuthAvailable(false);
          return;
        }
        if (res.ok) {
          const body = (await res.json()) as { user: AuthUser };
          if (!cancelled) setUser(body.user);
        }
      } catch {
        // Offline — stay signed out, app keeps working locally.
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openAuth = useCallback((mode: 'login' | 'signup') => setAuthModal(mode), []);
  const closeAuth = useCallback(() => setAuthModal(null), []);

  const submit = useCallback(async (path: string, username: string, password: string) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.status === 503) {
      setAuthAvailable(false);
      throw new Error('accounts are not set up on this deployment yet');
    }
    if (!res.ok) throw new Error(await readError(res, 'something went wrong'));
    const body = (await res.json()) as { user: AuthUser };
    setUser(body.user);
    setAuthModal(null);
    // Pull the account's boards down (newest-wins merge with local).
    void useProjectStore.getState().initializeProject();
  }, []);

  const login = useCallback(
    (username: string, password: string) => submit('/api/auth/login', username, password),
    [submit]
  );
  const signup = useCallback(
    (username: string, password: string) => submit('/api/auth/signup', username, password),
    [submit]
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Cookie may already be gone — still sign out locally.
    }
    setUser(null);
    // Next push 401s → store flips to local + "sign in to sync".
    void useProjectStore.getState().syncPush();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        authAvailable,
        authModal,
        openAuth,
        closeAuth,
        login,
        signup,
        logout,
      }}
    >
      {children}
      {authModal && <AuthModal mode={authModal} />}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
