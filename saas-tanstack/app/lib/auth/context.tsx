import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from './index';
import { getCurrentUserFn, logoutFn } from './server-fns';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      // 会话 cookie 是 HttpOnly 的，前端读不到也不该读，
      // 一律由服务端根据 cookie 判断身份。
      const userData = await getCurrentUserFn();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await logoutFn();
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      // cookie 由服务端清除，这里只同步本地状态
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, logout, refetchUser: fetchUser }),
    [user, loading, logout, fetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
