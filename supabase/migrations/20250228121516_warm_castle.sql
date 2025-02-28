/*
  # Add appointment status tracking

  1. Changes
    - Add `status` column to appointments table with enum type
    - Default status is 'scheduled'
    - Valid statuses: 'scheduled', 'completed', 'missed', 'cancelled'
  
  2. Security
    - Update RLS policies to maintain existing security model
*/

-- Add status column to appointments table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'status'
  ) THEN
    -- Create enum type for appointment status
    CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'missed', 'cancelled');
    
    -- Add status column with default value
    ALTER TABLE appointments ADD COLUMN status appointment_status NOT NULL DEFAULT 'scheduled';
  END IF;
END $$;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);