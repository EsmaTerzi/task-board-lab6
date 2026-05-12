-- Create JWT blocklist table
CREATE TABLE IF NOT EXISTS token_blocklist (
  jti TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_blocklist_expires_at 
  ON token_blocklist(expires_at);
