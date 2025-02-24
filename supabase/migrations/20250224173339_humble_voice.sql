/*
  # Time slot management system

  1. New Tables
    - `time_slot_settings`
      - `id` (uuid, primary key)
      - `date` (date, not null)
      - `time` (text, nullable - if null, entire day is disabled)
      - `is_disabled` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on date + time to prevent duplicates

  2. Security
    - Enable RLS on `time_slot_settings` table
    - Add policies for authenticated users to manage time slots
*/

CREATE TABLE time_slot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time text,
  is_disabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date, time)
);

ALTER TABLE time_slot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read time slot settings"
  ON time_slot_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage time slot settings"
  ON time_slot_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_time_slot_settings_updated_at
  BEFORE UPDATE ON time_slot_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();