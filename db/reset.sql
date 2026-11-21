-- ============================================================
--  Namoz Tracker — BAZANI 0 DAN QAYTA YARATISH (Neon / Postgres)
--  DIQQAT: bu barcha eski foydalanuvchi va tarixni o'chiradi!
--  Neon SQL Editor'da yoki `npm run db:reset` bilan ishga tushiring.
-- ============================================================

DROP TABLE IF EXISTS daily_entries CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_entries (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date                  DATE NOT NULL,
  bomdod                BOOLEAN DEFAULT FALSE,
  peshin                BOOLEAN DEFAULT FALSE,
  asr                   BOOLEAN DEFAULT FALSE,
  shom                  BOOLEAN DEFAULT FALSE,
  xufton                BOOLEAN DEFAULT FALSE,
  dhikr_count           INTEGER DEFAULT 0,
  salawat_count         INTEGER DEFAULT 0,
  subhanallah_count     INTEGER DEFAULT 0,
  alhamdulillah_count   INTEGER DEFAULT 0,
  allahu_akbar_count    INTEGER DEFAULT 0,
  la_ilaha_count        INTEGER DEFAULT 0,
  astaghfirullah_count  INTEGER DEFAULT 0,
  salawat_notes         TEXT DEFAULT '',
  morning_pages         INTEGER DEFAULT 0,
  evening_pages         INTEGER DEFAULT 0,
  book_name             TEXT DEFAULT '',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_entries_user_date ON daily_entries(user_id, date);
CREATE INDEX idx_entries_date ON daily_entries(date);

-- Rozilik xati imzolari (/rozilik.html)
DROP TABLE IF EXISTS rozilik;
CREATE TABLE rozilik (
  who       TEXT PRIMARY KEY,
  img       TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW()
);
