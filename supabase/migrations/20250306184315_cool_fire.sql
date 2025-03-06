/*
  # Add trigger for automatic current appointments

  1. New Function
    - create_current_appointment: Creates current_appointment entry for today's appointments
  
  2. New Trigger
    - auto_current_appointment_trigger: Triggers on appointment insert
    - Only creates current_appointment for today's appointments
    - Sets initial status as 'waiting'

  3. Changes
    - Adds automatic handling of today's appointments
    - Maintains data consistency between tables
*/

-- Create function to handle new appointments
CREATE OR REPLACE FUNCTION create_current_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create current_appointment for today's appointments
  IF NEW.appointment_date = CURRENT_DATE AND NEW.status = 'scheduled' THEN
    -- Check if current_appointment already exists
    IF NOT EXISTS (
      SELECT 1 FROM current_appointments 
      WHERE appointment_id = NEW.id
    ) THEN
      -- Create new current_appointment entry
      INSERT INTO current_appointments (
        appointment_id,
        status,
        created_at
      ) VALUES (
        NEW.id,
        'waiting',
        NOW()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new appointments
DROP TRIGGER IF EXISTS auto_current_appointment_trigger ON appointments;
CREATE TRIGGER auto_current_appointment_trigger
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_current_appointment();

-- Handle existing appointments for today
DO $$
BEGIN
  -- Create current_appointments for any existing appointments today that don't have one
  INSERT INTO current_appointments (
    appointment_id,
    status,
    created_at
  )
  SELECT 
    a.id,
    'waiting',
    NOW()
  FROM appointments a
  WHERE 
    a.appointment_date = CURRENT_DATE 
    AND a.status = 'scheduled'
    AND NOT EXISTS (
      SELECT 1 
      FROM current_appointments ca 
      WHERE ca.appointment_id = a.id
    );
END $$;