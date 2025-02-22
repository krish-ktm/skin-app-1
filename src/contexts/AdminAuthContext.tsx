import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminService, type AdminUser } from '../services/admin';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  admin: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  admin: null,
  login: async () => {},
  logout: async () => {},
  error: null,
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const admin = await adminService.getCurrentAdmin();
      setIsAuthenticated(!!admin);
      setAdmin(admin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setError(null);
      const admin = await adminService.login(email, password);
      localStorage.setItem('admin', JSON.stringify(admin));
      setAdmin(admin);
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }

  async function logout() {
    try {
      setError(null);
      await adminService.logout();
      setAdmin(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }

  return (
    <AdminAuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      admin,
      login,
      logout,
      error,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}