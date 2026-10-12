-- gen_random_uuid() is built into PostgreSQL 13+.
CREATE TABLE tickets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(200) NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'open'
              CHECK (status IN ('open', 'in_progress', 'closed')),
  priority    TEXT        NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('low', 'medium', 'high')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Serves the default listing order and the ?status= filter + pagination.
CREATE INDEX idx_tickets_created_at ON tickets (created_at DESC, id DESC);
CREATE INDEX idx_tickets_status_created_at ON tickets (status, created_at DESC, id DESC);
