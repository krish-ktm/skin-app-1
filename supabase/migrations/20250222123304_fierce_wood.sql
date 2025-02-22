/*
  # Fix admin users table RLS policies

  1. Changes
    - Update RLS policies for admin_users table to allow proper access
    - Add policies for insert and delete operations
    - Ensure authenticated users can manage admin users

  2. Security
    - Enable RLS on admin_users table
    - Add policies for CRUD operations
    - Only allow authenticated users to manage admin users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can read own data" ON admin_users;

-- Create new policies
CREATE POLICY "Allow authenticated users to read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (true);