import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_login: string | null;
}

export const adminService = {
  async login(email: string, password: string): Promise<AdminUser> {
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) throw new Error('Invalid email or password');
    if (!admin) throw new Error('Invalid email or password');

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) throw new Error('Invalid email or password');

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      created_at: admin.created_at,
      last_login: admin.last_login
    };
  },

  async getCurrentAdmin(): Promise<AdminUser | null> {
    const adminJson = localStorage.getItem('admin');
    if (!adminJson) return null;
    
    try {
      const admin = JSON.parse(adminJson);
      // Verify admin still exists
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', admin.id)
        .single();

      if (error || !data) {
        localStorage.removeItem('admin');
        return null;
      }

      return admin;
    } catch {
      localStorage.removeItem('admin');
      return null;
    }
  },

  async logout() {
    localStorage.removeItem('admin');
  }
};