CREATE TABLE progress_photos (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'front' CHECK (category IN ('front','side','back','other')),
  notes TEXT,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_photos_client ON progress_photos(client_id);
