-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  last_login timestamptz
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  gender text NOT NULL,
  age integer NOT NULL,
  status text DEFAULT 'scheduled',
  user_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  
  -- Add constraint for status values
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
  -- Add constraint for gender values
  CONSTRAINT valid_gender CHECK (gender IN ('male', 'female')),
  -- Add constraint for age range
  CONSTRAINT valid_age CHECK (age > 0 AND age <= 120)
);

-- Create time_slot_settings table
CREATE TABLE IF NOT EXISTS time_slot_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  time time,
  is_disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  
  -- Add constraint to ensure either full day or specific time slot is disabled
  CONSTRAINT valid_time_slot CHECK (
    (time IS NULL AND is_disabled = true) OR 
    (time IS NOT NULL)
  )
);

-- Create current_appointments table
CREATE TABLE IF NOT EXISTS current_appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  status text NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Add constraint for status values
  CONSTRAINT valid_current_status CHECK (status IN ('waiting', 'in_progress', 'completed'))
);

-- Ensure only one appointment can be in progress at a time
CREATE UNIQUE INDEX one_appointment_in_progress_idx 
ON current_appointments (appointment_id) 
WHERE status = 'in_progress';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_case_id ON appointments(case_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slot_settings(date);
CREATE INDEX IF NOT EXISTS idx_time_slots_date_time ON time_slot_settings(date, time) 
  WHERE time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_slots_disabled ON time_slot_settings(is_disabled);

CREATE INDEX IF NOT EXISTS idx_current_appointments_status ON current_appointments(status);
CREATE INDEX IF NOT EXISTS idx_current_appointments_started ON current_appointments(started_at);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Admin users can manage their own data"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for appointments
CREATE POLICY "Users can view their own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  ));

CREATE POLICY "Admins can manage appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  ));

-- Create policies for time_slot_settings
CREATE POLICY "Anyone can view time slot settings"
  ON time_slot_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage time slot settings"
  ON time_slot_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  ));

-- Create policies for current_appointments
CREATE POLICY "Anyone can view current appointments"
  ON current_appointments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage current appointments"
  ON current_appointments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  ));

-- Create functions and triggers
CREATE OR REPLACE FUNCTION check_appointment_conflicts()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the time slot is disabled
  IF EXISTS (
    SELECT 1 FROM time_slot_settings
    WHERE date = NEW.appointment_date
    AND (
      (time IS NULL AND is_disabled = true) OR
      (time = NEW.appointment_time AND is_disabled = true)
    )
  ) THEN
    RAISE EXCEPTION 'This time slot is not available for booking';
  END IF;

  -- Check if the time slot is full (max 4 appointments per slot)
  IF (
    SELECT COUNT(*)
    FROM appointments
    WHERE appointment_date = NEW.appointment_date
    AND appointment_time = NEW.appointment_time
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) >= 4 THEN
    RAISE EXCEPTION 'This time slot is full';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_appointment_conflicts_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_conflicts();

-- Create function to handle appointment completion
CREATE OR REPLACE FUNCTION complete_appointment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update the appointment status
    UPDATE appointments
    SET status = 'completed'
    WHERE id = NEW.appointment_id;
    
    -- Set completed_at timestamp
    NEW.completed_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complete_appointment_trigger
  BEFORE UPDATE ON current_appointments
  FOR EACH ROW
  EXECUTE FUNCTION complete_appointment();
