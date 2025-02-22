export interface AdminRole {
  id: string;
  name: string;
  permissions: Record<string, any>;
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: AdminRole;
}

export interface Permission {
  read?: boolean;
  write?: boolean;
  delete?: boolean;
}

export interface Permissions {
  all?: boolean;
  users?: Permission;
  appointments?: Permission;
  [key: string]: boolean | Permission | undefined;
}

export interface AdminState {
  isAdmin: boolean;
  role: AdminRole | null;
  permissions: Permissions;
}