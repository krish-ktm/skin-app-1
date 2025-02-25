/*
  # Cleanup time slots

  1. Changes
    - Add trigger to automatically remove time slot settings when disabled is set to false
    - Add function to handle the cleanup logic

  2. Purpose
    - Automatically clean up time slot records when admin enables slots
    - Maintain cleaner database state
    - Improve performance by removing unnecessary records
*/

-- Function to handle time slot cleanup
CREATE OR REPLACE FUNCTION cleanup_time_slot_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_disabled is being set to false, delete the record
  IF (TG_OP = 'UPDATE' AND NEW.is_disabled = false) THEN
    DELETE FROM time_slot_settings WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  
  -- For new records, only insert if is_disabled is true
  IF (TG_OP = 'INSERT' AND NEW.is_disabled = false) THEN
    RETURN NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cleanup
DROP TRIGGER IF EXISTS cleanup_time_slots_trigger ON time_slot_settings;
CREATE TRIGGER cleanup_time_slots_trigger
  BEFORE INSERT OR UPDATE ON time_slot_settings
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_time_slot_settings();