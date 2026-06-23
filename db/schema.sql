CREATE TABLE IF NOT EXISTS receipts (
  id           TEXT PRIMARY KEY,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bets (
  id               SERIAL PRIMARY KEY,
  receipt_id       TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  match_id         INTEGER NOT NULL,
  home_score       INTEGER,
  away_score       INTEGER,
  winner_pick      TEXT,
  person_name      TEXT,
  person_name_key  TEXT,
  match_snapshot   JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);

CREATE INDEX IF NOT EXISTS idx_bets_receipt_id ON bets(receipt_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bets_receipt_id_unique ON bets(receipt_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bets_match_person_active
  ON bets (match_id, person_name_key)
  WHERE person_name_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receipts_active ON receipts (id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS bet_scores (
  receipt_id         TEXT PRIMARY KEY REFERENCES receipts(id) ON DELETE CASCADE,
  match_id           INTEGER NOT NULL,
  points             INTEGER NOT NULL DEFAULT 0,
  score_type         TEXT NOT NULL DEFAULT 'pending',
  winner_points      INTEGER NOT NULL DEFAULT 0,
  home_team_points   INTEGER NOT NULL DEFAULT 0,
  away_team_points   INTEGER NOT NULL DEFAULT 0,
  actual_home_score  INTEGER,
  actual_away_score  INTEGER,
  computed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bet_scores_match_id ON bet_scores(match_id);

CREATE INDEX IF NOT EXISTS idx_bet_scores_score_type ON bet_scores(score_type);

CREATE TABLE IF NOT EXISTS champion_bets (
  id               SERIAL PRIMARY KEY,
  receipt_id       TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  team_id          INTEGER NOT NULL,
  team_snapshot    JSONB NOT NULL,
  person_name      TEXT NOT NULL,
  person_name_key  TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_champion_bets_receipt_id_unique ON champion_bets(receipt_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_champion_bets_person_active ON champion_bets(person_name_key);

CREATE TABLE IF NOT EXISTS champion_scores (
  receipt_id       TEXT PRIMARY KEY REFERENCES receipts(id) ON DELETE CASCADE,
  final_match_id   INTEGER NOT NULL,
  points           INTEGER NOT NULL DEFAULT 0,
  score_type       TEXT NOT NULL DEFAULT 'pending',
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name      TEXT NOT NULL,
  person_name_key  TEXT NOT NULL,
  email            TEXT,
  password_hash    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_person_name_key
  ON participants (person_name_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_email
  ON participants (email)
  WHERE email IS NOT NULL;