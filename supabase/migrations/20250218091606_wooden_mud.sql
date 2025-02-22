/*
  # Create appointments table

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `case_id` (text, unique) - Random generated booking reference
      - `name` (text) - Customer's full name
      - `phone` (text) - Customer's phone number
      - `appointment_date` (date) - Selected appointment date
      - `appointment_time` (text) - Selected appointment time slot
      - `created_at` (timestamp)
      - `user_id` (uuid) - Reference to auth.users
  
  2. Security
    - Enable RLS on `appointments` table
    - Add policies for authenticated users to read their own appointments
    - Add policy for inserting new appointments
*/

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);