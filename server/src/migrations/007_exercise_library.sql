CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  exercise_name TEXT UNIQUE NOT NULL,
  description TEXT,
  video_url TEXT,
  video_path TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
