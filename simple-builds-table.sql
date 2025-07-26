-- Simple builds table for DroneBuilder
-- Run this in Supabase SQL Editor

-- Create builds table
CREATE TABLE IF NOT EXISTS builds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parts JSONB NOT NULL DEFAULT '[]',
  total_cost DECIMAL(10,2) DEFAULT 0,
  total_weight DECIMAL(8,3) DEFAULT 0,
  flight_time INTEGER DEFAULT 0,
  max_payload DECIMAL(8,3) DEFAULT 0,
  estimated_speed INTEGER DEFAULT 0,
  estimated_range INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_builds_user_id ON builds(user_id);

-- Enable Row Level Security
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;

-- Create basic policies (allow all operations for now)
CREATE POLICY "Allow all operations on builds" ON builds
  FOR ALL USING (true);

-- Test the table
SELECT 'Builds table created successfully!' as status; 