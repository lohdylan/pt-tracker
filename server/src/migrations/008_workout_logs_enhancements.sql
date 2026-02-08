ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS sets_detail JSONB DEFAULT '[]';
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill exercise_id from matching exercise_name
UPDATE workout_logs wl
SET exercise_id = e.id
FROM exercises e
WHERE wl.exercise_name = e.exercise_name
  AND wl.exercise_id IS NULL;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
