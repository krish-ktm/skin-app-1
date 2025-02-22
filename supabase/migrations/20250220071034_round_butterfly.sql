/*
  # Update appointments table schema

  1. Changes
    - Remove unique constraint from case_id to allow multiple appointments per case
    - Add index on case_id for faster lookups
*/

ALTER TABLE appointments DROP CONSTRAINT appointments_case_id_key;
CREATE INDEX idx_appointments_case_id ON appointments(case_id);