/*
  # Update appointments table for doctor and receptionist features

  1. Changes
    - Add status column for appointment tracking
    - Add is_current flag for current appointment
    - Add default values and constraints

  2. Security
    - Update RLS policies for new columns
*/

-- Add new columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled'
CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_is_current ON appointments(is_current);

-- Update RLS policies
CREATE POLICY "Enable read access for authenticated users"
ON appointments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON appointments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);