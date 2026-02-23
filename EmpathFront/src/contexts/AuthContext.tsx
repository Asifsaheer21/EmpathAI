import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { authApi, userApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  loginWithGoogle: (credential: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<{ error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    
    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return {};
    }
    
    return { error: response.error || 'Login failed' };
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const response = await authApi.register({ email, password, name });
    
    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return {};
    }
    
    return { error: response.error || 'Registration failed' };
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const response = await authApi.googleAuth({ credential });
    
    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return {};
    }
    
    return { error: response.error || 'Google login failed' };
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; avatar?: string }) => {
    const response = await userApi.updateProfile(data);
    
    if (response.success && response.data) {
      setUser(response.data);
      localStorage.setItem('auth_user', JSON.stringify(response.data));
      return {};
    }
    
    return { error: response.error || 'Profile update failed' };
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const response = await userApi.updatePassword(currentPassword, newPassword);
    
    if (response.success) {
      return {};
    }
    
    return { error: response.error || 'Password update failed' };
  }, []);

  const deleteAccount = useCallback(async () => {
    const response = await userApi.deleteAccount();
    
    if (response.success) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      return {};
    }
    
    return { error: response.error || 'Account deletion failed' };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        updatePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
