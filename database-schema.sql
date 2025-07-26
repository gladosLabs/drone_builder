-- DroneBuilder Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create builds table
CREATE TABLE IF NOT EXISTS builds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Create parts_catalog table
CREATE TABLE IF NOT EXISTS parts_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  manufacturer TEXT,
  model TEXT,
  cost DECIMAL(10,2) DEFAULT 0,
  weight DECIMAL(8,3) DEFAULT 0,
  specs JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  build_id UUID REFERENCES builds(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, build_id)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  theme TEXT DEFAULT 'light',
  units TEXT DEFAULT 'metric',
  notifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_builds_user_id ON builds(user_id);
CREATE INDEX IF NOT EXISTS idx_builds_created_at ON builds(created_at);
CREATE INDEX IF NOT EXISTS idx_builds_public ON builds(is_public);
CREATE INDEX IF NOT EXISTS idx_parts_catalog_category ON parts_catalog(category);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_build_id ON user_favorites(build_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_builds_updated_at BEFORE UPDATE ON builds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Builds policies
CREATE POLICY "Users can view their own builds" ON builds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public builds" ON builds
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own builds" ON builds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own builds" ON builds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own builds" ON builds
  FOR DELETE USING (auth.uid() = user_id);

-- Parts catalog policies (public read access)
CREATE POLICY "Anyone can view parts catalog" ON parts_catalog
  FOR SELECT USING (true);

-- User favorites policies
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert some sample parts data
INSERT INTO parts_catalog (name, category, subcategory, manufacturer, model, cost, weight, specs) VALUES
-- Frames
('DJI F450 Frame', 'frame', 'quadcopter', 'DJI', 'F450', 25.00, 0.280, '{"arms": 4, "size": "450mm", "material": "carbon_fiber"}'),
('DJI F550 Frame', 'frame', 'hexacopter', 'DJI', 'F550', 35.00, 0.350, '{"arms": 6, "size": "550mm", "material": "carbon_fiber"}'),
('Tarot FY680 Frame', 'frame', 'hexacopter', 'Tarot', 'FY680', 45.00, 0.420, '{"arms": 6, "size": "680mm", "material": "carbon_fiber"}'),

-- Motors
('DJI 2212 Motor', 'motor', 'brushless', 'DJI', '2212', 15.00, 0.080, '{"kv": 920, "max_current": 18, "thrust": 800}'),
('T-Motor MN2214', 'motor', 'brushless', 'T-Motor', 'MN2214', 25.00, 0.095, '{"kv": 920, "max_current": 22, "thrust": 1000}'),
('Sunnysky X2212', 'motor', 'brushless', 'Sunnysky', 'X2212', 18.00, 0.085, '{"kv": 980, "max_current": 20, "thrust": 900}'),

-- Propellers
('DJI 1045 Prop', 'propeller', 'standard', 'DJI', '1045', 5.00, 0.015, '{"diameter": 10, "pitch": 4.5, "blades": 2}'),
('Gemfan 1045 Prop', 'propeller', 'standard', 'Gemfan', '1045', 3.00, 0.012, '{"diameter": 10, "pitch": 4.5, "blades": 2}'),
('T-Motor 1555 Prop', 'propeller', 'carbon', 'T-Motor', '1555', 12.00, 0.025, '{"diameter": 15, "pitch": 5.5, "blades": 2}'),

-- ESCs
('DJI 30A ESC', 'esc', 'standard', 'DJI', '30A', 12.00, 0.025, '{"current": 30, "protocol": "oneshot125"}'),
('T-Motor 40A ESC', 'esc', 'high_current', 'T-Motor', '40A', 18.00, 0.035, '{"current": 40, "protocol": "dshot600"}'),
('Hobbywing 60A ESC', 'esc', 'high_current', 'Hobbywing', '60A', 25.00, 0.045, '{"current": 60, "protocol": "dshot1200"}'),

-- Flight Controllers
('Pixhawk 4', 'flight_controller', 'advanced', 'Holybro', 'Pixhawk 4', 200.00, 0.080, '{"processor": "STM32F765", "sensors": ["gps", "compass", "barometer"]}'),
('F4 V3 Pro', 'flight_controller', 'standard', 'Matek', 'F4 V3 Pro', 45.00, 0.025, '{"processor": "STM32F405", "sensors": ["gps", "compass"]}'),
('Naza-M V2', 'flight_controller', 'gps', 'DJI', 'Naza-M V2', 300.00, 0.100, '{"processor": "STM32F427", "sensors": ["gps", "compass", "barometer"]}'),

-- Batteries
('Turnigy 5000mAh 4S', 'battery', 'lipo', 'Turnigy', '5000mAh 4S', 45.00, 0.450, '{"capacity": 5000, "voltage": 14.8, "c_rating": 25}'),
('Tattu 6000mAh 6S', 'battery', 'lipo', 'Tattu', '6000mAh 6S', 85.00, 0.650, '{"capacity": 6000, "voltage": 22.2, "c_rating": 30}'),
('Zippy 4000mAh 3S', 'battery', 'lipo', 'Zippy', '4000mAh 3S', 25.00, 0.320, '{"capacity": 4000, "voltage": 11.1, "c_rating": 20}'),

-- Cameras
('GoPro Hero 8', 'camera', 'action', 'GoPro', 'Hero 8', 300.00, 0.126, '{"resolution": "4K", "weight": 126, "type": "action"}'),
('DJI Mini 2 Camera', 'camera', 'fpv', 'DJI', 'Mini 2', 150.00, 0.080, '{"resolution": "4K", "weight": 80, "type": "fpv"}'),
('Runcam Split 4', 'camera', 'fpv', 'Runcam', 'Split 4', 45.00, 0.025, '{"resolution": "4K", "weight": 25, "type": "fpv"}'),

-- Companion Computers
('Raspberry Pi 4', 'companion_computer', 'single_board', 'Raspberry Pi', '4B', 55.00, 0.045, '{"ram": "4GB", "storage": "32GB", "os": "linux"}'),
('Jetson Nano', 'companion_computer', 'ai', 'NVIDIA', 'Jetson Nano', 99.00, 0.070, '{"ram": "4GB", "storage": "16GB", "os": "linux"}'),
('BeagleBone Black', 'companion_computer', 'single_board', 'BeagleBoard', 'Black', 45.00, 0.040, '{"ram": "512MB", "storage": "4GB", "os": "linux"}')

ON CONFLICT DO NOTHING; 