-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE build_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE part_category AS ENUM ('frame', 'motor', 'propeller', 'esc', 'fc', 'companion', 'other');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Builds table
CREATE TABLE public.builds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status build_status DEFAULT 'draft',
  parts JSONB NOT NULL, -- Store the parts array as JSON
  total_cost DECIMAL(10,2),
  total_weight DECIMAL(10,2),
  flight_time INTEGER, -- in minutes
  max_payload DECIMAL(10,2),
  estimated_speed INTEGER, -- km/h
  estimated_range INTEGER, -- meters
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parts catalog table (for reference)
CREATE TABLE public.parts_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id TEXT UNIQUE NOT NULL, -- e.g., "frame-x", "motor-standard"
  name TEXT NOT NULL,
  category part_category NOT NULL,
  description TEXT,
  emoji TEXT,
  cost DECIMAL(10,2),
  weight DECIMAL(10,2),
  properties JSONB, -- Store additional properties like kv, thrust, etc.
  compatible_with TEXT[], -- Array of compatible part IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User favorites table
CREATE TABLE public.user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, build_id)
);

-- User settings table
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'light',
  units TEXT DEFAULT 'metric', -- metric or imperial
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_builds_user_id ON public.builds(user_id);
CREATE INDEX idx_builds_status ON public.builds(status);
CREATE INDEX idx_builds_created_at ON public.builds(created_at);
CREATE INDEX idx_parts_catalog_category ON public.parts_catalog(category);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Builds policies
CREATE POLICY "Users can view their own builds" ON public.builds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public builds" ON public.builds
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own builds" ON public.builds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own builds" ON public.builds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own builds" ON public.builds
  FOR DELETE USING (auth.uid() = user_id);

-- Parts catalog policies (read-only for all authenticated users)
CREATE POLICY "Anyone can view parts catalog" ON public.parts_catalog
  FOR SELECT USING (true);

-- User favorites policies
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Functions and triggers

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_builds_updated_at
  BEFORE UPDATE ON public.builds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample parts data
INSERT INTO public.parts_catalog (part_id, name, category, description, emoji, cost, weight, properties, compatible_with) VALUES
-- Frames
('frame-x', 'X Frame', 'frame', 'A classic X-shaped frame, lightweight and agile.', '❌', 60.00, 120.00, '{"arms": 4, "useCase": "Best for racing and freestyle due to its symmetry and agility.", "properties": "4 arms, lightweight, fast, responsive"}', NULL),
('frame-h', 'H Frame', 'frame', 'H-shaped frame, stable and strong.', '🇭', 70.00, 140.00, '{"arms": 4, "useCase": "Great for carrying payloads and stable flight.", "properties": "4 arms, stable, good for heavy lift"}', NULL),
('frame-cinewhoop', 'Cinewhoop', 'frame', 'Ducted frame for safe, cinematic indoor flying.', '🎥', 80.00, 130.00, '{"arms": 4, "useCase": "Perfect for indoor and close-proximity filming.", "properties": "4 arms, ducted, safe, cinematic"}', NULL),
('frame-tinywhoop', 'TinyWhoop', 'frame', 'Ultra-small frame for indoor fun.', '🪁', 30.00, 60.00, '{"arms": 4, "useCase": "Best for beginners and indoor flying.", "properties": "4 arms, tiny, lightweight, safe"}', NULL),
('frame-hex', 'Hex Frame', 'frame', 'Six-arm frame for extra stability and lift.', '🔷', 120.00, 200.00, '{"arms": 6, "useCase": "Great for heavy payloads and stable video.", "properties": "6 arms, stable, heavy lift"}', NULL),
('frame-octo', 'Octo Frame', 'frame', 'Eight-arm frame for maximum lift and redundancy.', '🛸', 180.00, 260.00, '{"arms": 8, "useCase": "Used in professional filming and industrial drones.", "properties": "8 arms, max lift, redundancy"}', NULL),

-- Motors
('motor-standard', 'Standard Motor', 'motor', 'General purpose brushless motor.', '⚡', 25.00, 35.00, '{"kv": 2300, "thrust": 800}', '["frame-x", "frame-h", "frame-cinewhoop", "frame-tinywhoop", "frame-hex", "frame-octo"]'),
('motor-racing', 'Racing Motor', 'motor', 'High KV motor for racing drones.', '🏎️', 40.00, 35.00, '{"kv": 2700, "thrust": 950}', '["frame-x", "frame-h"]'),
('motor-cinewhoop', 'Cinewhoop Motor', 'motor', 'Optimized for cinewhoop frames.', '🎬', 35.00, 35.00, '{"kv": 2000, "thrust": 700}', '["frame-cinewhoop"]'),
('motor-heavy', 'Heavy Lift Motor', 'motor', 'For hex/octo frames and heavy payloads.', '💪', 60.00, 35.00, '{"kv": 1200, "thrust": 1500}', '["frame-hex", "frame-octo"]'),

-- Propellers
('prop-standard', 'Standard Propeller', 'propeller', 'General purpose propeller.', '🌀', 3.00, 5.00, '{}', '["motor-standard", "motor-heavy"]'),
('prop-racing', 'Racing Propeller', 'propeller', 'Lightweight, high-speed prop for racing.', '🏁', 5.00, 5.00, '{}', '["motor-racing"]'),
('prop-cinewhoop', 'Cinewhoop Propeller', 'propeller', 'Ducted prop for cinewhoop.', '🎦', 4.00, 5.00, '{}', '["motor-cinewhoop"]'),

-- ESCs
('esc-standard', 'Standard ESC', 'esc', 'Electronic speed controller for most drones.', '🔌', 15.00, 10.00, '{}', '["motor-standard", "motor-cinewhoop", "motor-heavy"]'),
('esc-racing', 'Racing ESC', 'esc', 'High current ESC for racing motors.', '⚡', 20.00, 10.00, '{}', '["motor-racing"]'),

-- Flight Controllers
('fc-pixhawk', 'Pixhawk', 'fc', 'Popular open-source flight controller for all types of drones.', '🦅', 120.00, 50.00, '{}', NULL),
('fc-orangecube', 'OrangeCube', 'fc', 'High-end flight controller for professional and industrial drones.', '🟧', 200.00, 50.00, '{}', NULL),
('fc-matek', 'Matek', 'fc', 'Affordable, reliable FC for racing and freestyle.', '🟦', 60.00, 50.00, '{}', NULL),
('fc-betaflight', 'BetaFlight', 'fc', 'Widely used FC for FPV racing and freestyle.', '🦋', 40.00, 50.00, '{}', NULL),

-- Companion Computers
('companion-rpi', 'Raspberry Pi', 'companion', 'Versatile companion computer for AI, vision, and autonomy.', '🍓', 70.00, 45.00, '{}', NULL),
('companion-jetson', 'Jetson Nano', 'companion', 'NVIDIA Jetson Nano for advanced AI and computer vision.', '🤖', 120.00, 45.00, '{}', NULL),
('companion-odroid', 'Odroid', 'companion', 'Powerful SBC for robotics and drones.', '🟩', 90.00, 45.00, '{}', NULL),

-- Other Parts
('battery', 'LiPo Battery', 'other', 'Provides power to all the drone parts.', '🔋', 40.00, 180.00, '{"capacity": 2200}', NULL),
('camera', 'Camera', 'other', 'Lets you see from the drone point of view.', '📷', 50.00, 30.00, '{}', NULL),
('gps', 'GPS Module', 'other', 'Helps the drone know where it is in the world.', '📡', 30.00, 15.00, '{}', NULL); 