/*
  # Add age field to appointments table

  1. Changes
    - Add age column to appointments table with default value of 0
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'age'
  ) THEN
    ALTER TABLE appointments ADD COLUMN age integer NOT NULL DEFAULT 0;
  END IF;
END $$;