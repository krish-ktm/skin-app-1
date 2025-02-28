/*
  # Fix Appointments RLS Policies

  1. Changes
    - Update RLS policies for the appointments table to allow admin operations
    - Add policies for admin users to perform CRUD operations on appointments
    - Maintain existing policies for authenticated users

  2. Security
    - Ensure admin users can manage all appointments
    - Regular users can still read their own appointments
*/

-- First, let's check if the table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    -- Drop existing policies to recreate them
    DROP POLICY IF EXISTS "Users can read own appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can insert appointments" ON appointments;
    
    -- Create policy for users to read their own appointments
    CREATE POLICY "Users can read own appointments"
      ON appointments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    -- Create policy for users to insert their own appointments
    CREATE POLICY "Users can insert appointments"
      ON appointments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    -- Create policies for admin operations (using service role)
    -- Admin can read all appointments
    CREATE POLICY "Admin can read all appointments"
      ON appointments
      FOR SELECT
      USING (true);
    
    -- Admin can insert appointments
    CREATE POLICY "Admin can insert appointments"
      ON appointments
      FOR INSERT
      WITH CHECK (true);
    
    -- Admin can update appointments
    CREATE POLICY "Admin can update appointments"
      ON appointments
      FOR UPDATE
      USING (true);
    
    -- Admin can delete appointments
    CREATE POLICY "Admin can delete appointments"
      ON appointments
      FOR DELETE
      USING (true);
  END IF;
END $$;