-- Activity Logs table
-- Tracks daily app opens for streak calculation.
-- Run this once in the Supabase SQL Editor to enable cross-device streak sync.

CREATE TABLE IF NOT EXISTS activity_logs (
  user_id    uuid REFERENCES auth.users NOT NULL,
  date       date NOT NULL,
  logged_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own activity logs" ON activity_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
