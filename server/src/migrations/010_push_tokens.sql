CREATE TABLE push_tokens (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('trainer','client')),
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_push_tokens_token ON push_tokens(expo_push_token);
