import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthResponse } from '../services/authService';
import { getTokenClaims, isTokenExpired } from '../utils/jwtDecoder';

interface User {
  email: string;
  role: string;
  id: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
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

  const verifyToken = (token: string) => {
    try {
      if (isTokenExpired(token)) {
        throw new Error('Token expired');
      }

      const claims = getTokenClaims(token);
      if (!claims) {
        throw new Error('Invalid token');
      }

      const userData = {
        email: claims.email,
        role: claims.role,
        id: claims.id
      };
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const setUserData = (data: AuthResponse) => {
    const userData = { email: data.user.email, role: data.user.role, id: data.user.id };
    localStorage.setItem('token', data.token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    setUserData(data);
  };

  const register = async (email: string, password: string, role: string) => {
    const data = await authService.register({ email, password, role });
    setUserData(data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};