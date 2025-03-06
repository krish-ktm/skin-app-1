/*
  # Add appointment status and current appointments schema

  1. Changes to appointments table
    - Add status field with enum type
    - Add default status of 'scheduled'
  
  2. New Tables
    - current_appointments
      - id (uuid, primary key)
      - appointment_id (uuid, foreign key)
      - status (enum: waiting, in_progress, completed)
      - started_at (timestamp)
      - completed_at (timestamp)
  
  3. Security
    - Enable RLS on current_appointments table
    - Add policies for authenticated users
*/

-- Create appointment status type
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'missed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status appointment_status DEFAULT 'scheduled';

-- Create current appointments status type
DO $$ BEGIN
  CREATE TYPE current_appointment_status AS ENUM ('waiting', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create current_appointments table
CREATE TABLE IF NOT EXISTS current_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  status current_appointment_status NOT NULL DEFAULT 'waiting',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Enable RLS
ALTER TABLE current_appointments ENABLE ROW LEVEL SECURITY;

-- Policies for current_appointments
CREATE POLICY "Allow authenticated users to read current appointments"
  ON current_appointments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert current appointments"
  ON current_appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update current appointments"
  ON current_appointments
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to update appointment status when current appointment is completed
CREATE OR REPLACE FUNCTION update_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.status != OLD.status THEN
    UPDATE appointments 
    SET status = 'completed'
    WHERE id = NEW.appointment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update appointment status
DROP TRIGGER IF EXISTS update_appointment_status_trigger ON current_appointments;
CREATE TRIGGER update_appointment_status_trigger
  AFTER UPDATE ON current_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_status();