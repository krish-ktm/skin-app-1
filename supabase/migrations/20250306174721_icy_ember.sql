/*
  # Create Current Appointment Table

  1. New Tables
    - `current_appointments`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, references appointments)
      - `status` (text) - 'waiting', 'in_progress', 'completed'
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `current_appointments` table
    - Add policies for authenticated users
*/

-- Create current_appointments table
CREATE TABLE IF NOT EXISTS current_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_active_appointment UNIQUE (appointment_id, status) 
    WHERE status IN ('waiting', 'in_progress')
);

-- Enable RLS
ALTER TABLE current_appointments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to view current appointments"
  ON current_appointments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create current appointments"
  ON current_appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update current appointments"
  ON current_appointments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS current_appointments_status_idx ON current_appointments(status);
CREATE INDEX IF NOT EXISTS current_appointments_appointment_id_idx ON current_appointments(appointment_id);