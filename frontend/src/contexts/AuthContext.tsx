import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthResponse } from '../services/authService';
import { getTokenClaims, isTokenExpired } from '../utils/jwtDecoder';
import { User } from '../types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      if (isTokenExpired(token)) {
        throw new Error('Token expired');
      }

      const claims = getTokenClaims(token);
      if (!claims) {
        throw new Error('Invalid token');
      }

      // Fetch full user profile including balance
      const userProfile = await authService.getProfile();
      setUser(userProfile);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const setUserData = async (data: AuthResponse) => {
    localStorage.setItem('token', data.token);
    // Fetch full user profile including balance
    try {
      const userProfile = await authService.getProfile();
      setUser(userProfile);
    } catch (error) {
      // Fallback to data from auth response
      setUser(data.user);
    }
    setIsAuthenticated(true);
  };

  const refreshBalance = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const balanceData = await authService.getBalance();
      setUser(prev => prev ? { ...prev, balance: balanceData.balance } : null);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    await setUserData(data);
  };

  const register = async (email: string, password: string, role: string) => {
    const data = await authService.register({ email, password, role });
    await setUserData(data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    setUser,
    login,
    register,
    logout,
    loading,
    refreshBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};