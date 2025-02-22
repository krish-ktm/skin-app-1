import { supabase } from '../lib/supabase';
import type { AdminUser, AdminRole } from '../types/admin';

export const adminService = {
  async getAdminUsers() {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*, role:admin_roles(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (AdminUser & { role: AdminRole })[];
  },

  async getRoles() {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as AdminRole[];
  },

  async createAdminUser(email: string, password: string, roleId: string) {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Then create admin user
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: authData.user.id,
        role_id: roleId,
      });

    if (adminError) {
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw adminError;
    }

    return authData.user;
  },

  async updateAdminUser(id: string, data: Partial<AdminUser>) {
    const { error } = await supabase
      .from('admin_users')
      .update(data)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteAdminUser(id: string) {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};