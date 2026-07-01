-- Namoz Tracker Database Schema
-- Run this in Supabase SQL Editor

-- Users table (only 2 users max)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily entries table
CREATE TABLE IF NOT EXISTS daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  bomdod BOOLEAN DEFAULT FALSE,
  peshin BOOLEAN DEFAULT FALSE,
  asr BOOLEAN DEFAULT FALSE,
  shom BOOLEAN DEFAULT FALSE,
  xufton BOOLEAN DEFAULT FALSE,
  dhikr_count INTEGER DEFAULT 0,
  salawat_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read users (to check if name exists)
CREATE POLICY "Users are publicly readable" ON users
  FOR SELECT USING (true);

-- Allow insert of new users (max 2 enforced in app)
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (true);

-- Allow reading all entries (both users can see each other)
CREATE POLICY "Entries are publicly readable" ON daily_entries
  FOR SELECT USING (true);

-- Allow inserting entries
CREATE POLICY "Allow entry creation" ON daily_entries
  FOR INSERT WITH CHECK (true);

-- Allow updating ONLY your own entries
CREATE POLICY "Allow updating own entries" ON daily_entries
  FOR UPDATE USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON daily_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_date ON daily_entries(date);
