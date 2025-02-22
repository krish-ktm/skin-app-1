/*
  # Admin Users and Roles System

  1. New Tables
    - `admin_roles`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `permissions` (jsonb)
      - `created_at` (timestamp)
    
    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role_id` (uuid, references admin_roles)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access
*/

-- Create admin_roles table
CREATE TABLE admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create admin_users table
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES admin_roles(id) ON DELETE RESTRICT NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role_id ON admin_users(role_id);

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin users can read roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Insert default roles
INSERT INTO admin_roles (name, permissions) VALUES
  ('super_admin', '{"all": true}'::jsonb),
  ('admin', '{"users": {"read": true, "write": true}, "appointments": {"read": true, "write": true}}'::jsonb),
  ('manager', '{"appointments": {"read": true, "write": true}}'::jsonb);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = $1
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;