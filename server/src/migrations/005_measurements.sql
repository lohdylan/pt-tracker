CREATE TABLE measurements (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_lbs NUMERIC,
  body_fat_pct NUMERIC,
  chest_in NUMERIC,
  waist_in NUMERIC,
  hips_in NUMERIC,
  arm_in NUMERIC,
  thigh_in NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_measurements_client ON measurements(client_id);
