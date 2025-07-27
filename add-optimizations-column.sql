-- Add optimizations column to builds table
-- This script adds support for storing optimization data in the builds table

-- Add the optimizations column as JSONB to store optimization metadata
ALTER TABLE builds 
ADD COLUMN IF NOT EXISTS optimizations JSONB DEFAULT '{}'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN builds.optimizations IS 'JSON object storing optimization metadata including battery optimizations, performance improvements, and application timestamps';

-- Create an index on the optimizations column for better query performance
CREATE INDEX IF NOT EXISTS idx_builds_optimizations ON builds USING GIN (optimizations);

-- Example of what the optimizations column might contain:
-- {
--   "batteryOptimization": {
--     "type": "battery",
--     "selectedBattery": {...},
--     "appliedAt": "2024-01-01T00:00:00Z",
--     "performanceImprovement": {
--       "flightTime": 5,
--       "weight": -50,
--       "cost": -10
--     }
--   },
--   "lastUpdated": "2024-01-01T00:00:00Z"
-- } 