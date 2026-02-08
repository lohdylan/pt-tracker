CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('trainer','client')),
  sender_id INTEGER,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_client ON messages(client_id);
CREATE INDEX idx_messages_created ON messages(created_at);
