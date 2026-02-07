CREATE TABLE workout_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
