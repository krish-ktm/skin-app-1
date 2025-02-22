/*
  # Add gender field to appointments table

  1. Changes
    - Add gender column to appointments table with type text
    - Set default value to 'male'
    - Make the column not nullable
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'gender'
  ) THEN
    ALTER TABLE appointments ADD COLUMN gender text NOT NULL DEFAULT 'male';
  END IF;
END $$;