import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AdminRole, AdminUser, Permissions } from '../types/admin';

interface AdminContextType {
  isAdmin: boolean;
  role: AdminRole | null;
  permissions: Permissions;
  isLoading: boolean;
  error: string | null;
  checkAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  role: null,
  permissions: {},
  isLoading: true,
  error: null,
  checkAdminStatus: async () => {},
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setRole(null);
        setPermissions({});
        return;
      }

      // Get admin user with role
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*, role:admin_roles(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (adminError) throw adminError;

      if (!adminUser) {
        setIsAdmin(false);
        setRole(null);
        setPermissions({});
        return;
      }

      setIsAdmin(true);
      setRole(adminUser.role as AdminRole);
      setPermissions(adminUser.role.permissions as Permissions);
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AdminContext.Provider value={{
      isAdmin,
      role,
      permissions,
      isLoading,
      error,
      checkAdminStatus,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}