import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './index';
import { getCurrentUserFn, logoutFn } from './server-fns';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (sessionToken: string) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const userData = await getCurrentUserFn();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (sessionToken: string) => {
    document.cookie = `session_token=${sessionToken}; path=/; max-age=${30 * 24 * 60 * 60}`;
    fetchUser();
  };

  const logout = async () => {
    try {
      await logoutFn();
      document.cookie = 'session_token=; path=/; max-age=0';
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
