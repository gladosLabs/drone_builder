-- Simple profiles table for DroneBuilder
-- Run this in Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies (allow all operations for now)
CREATE POLICY "Allow all operations on profiles" ON profiles
  FOR ALL USING (true);

-- Test the table
SELECT 'Profiles table created successfully!' as status; 