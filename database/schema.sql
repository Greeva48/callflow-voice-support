-- ============================================================
-- VoiceAI Support — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Calls table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id     TEXT,
  agent_id         TEXT NOT NULL,
  phone_number     TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'initiated',
  duration         INTEGER,            -- seconds
  transcript       TEXT,
  order_id         TEXT,
  order_status     TEXT,
  cost             DECIMAL(10, 6),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calls_execution_id_idx ON calls(execution_id);
CREATE INDEX IF NOT EXISTS calls_created_at_idx   ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS calls_status_idx        ON calls(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security ───────────────────────────────────────────────────
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by backend)
CREATE POLICY "Service role full access"
  ON calls FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── Sample data ──────────────────────────────────────────────────────────
INSERT INTO calls (execution_id, agent_id, phone_number, status, duration, transcript, order_id, order_status, cost, created_at)
VALUES
  ('exec_demo_001', 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269', '+919876543210', 'completed', 124,
   'Agent: Hello! How can I help you with your order today?'||E'\n'||'User: I want to check order ORD-001'||E'\n'||'Agent: Your order ORD-001 is out for delivery and will arrive today.',
   'ORD-001', 'out_for_delivery', 0.004200, NOW() - INTERVAL '2 hours'),

  ('exec_demo_002', 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269', '+919876543211', 'completed', 87,
   'Agent: Hi there! I can help you check your order status.'||E'\n'||'User: Order ORD-002 please.'||E'\n'||'Agent: Order ORD-002 has been shipped and is in transit.',
   'ORD-002', 'shipped', 0.003100, NOW() - INTERVAL '5 hours'),

  ('exec_demo_003', 'ba65c9d5-cbe1-42d5-85b0-44ba18d14269', '+919876543212', 'no-answer', NULL, NULL, NULL, NULL, 0.000800, NOW() - INTERVAL '1 day');
