CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('trainer','client')),
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  session_reminders BOOLEAN DEFAULT TRUE,
  workout_logged BOOLEAN DEFAULT TRUE,
  measurement_recorded BOOLEAN DEFAULT TRUE,
  reminder_minutes_before INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, client_id)
);
