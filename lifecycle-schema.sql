-- Full-Stack Drone Lifecycle Schema for DroneBuilder
-- This schema supports the complete drone development lifecycle from design to maintenance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. DESIGN STAGE TABLES
-- ========================================

-- Advanced component specifications
CREATE TABLE component_specs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    component_type VARCHAR(50) NOT NULL, -- 'frame', 'motor', 'esc', 'battery', 'propeller', etc.
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    specifications JSONB NOT NULL, -- Detailed specs like weight, dimensions, power, etc.
    compatibility_rules JSONB, -- Rules for what this component works with
    price_range JSONB, -- Min/max price and currency
    availability_status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battery specifications and optimization
CREATE TABLE battery_specs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    capacity_mah INTEGER NOT NULL,
    voltage_cells INTEGER NOT NULL,
    discharge_rate_c REAL NOT NULL,
    weight_grams REAL NOT NULL,
    dimensions_mm JSONB, -- Length, width, height
    chemistry VARCHAR(50), -- LiPo, LiFe, etc.
    cycle_life INTEGER,
    max_charge_rate_c REAL,
    price_usd DECIMAL(10,2),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Power distribution analysis
CREATE TABLE power_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    total_power_draw_w REAL,
    peak_power_draw_w REAL,
    battery_capacity_mah INTEGER,
    estimated_flight_time_min INTEGER,
    power_efficiency_percent REAL,
    voltage_drop_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CAD export configurations
CREATE TABLE cad_exports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL, -- 'stl', 'step', 'dxf', 'iges'
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    export_settings JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Flight envelope calculations
CREATE TABLE flight_envelopes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    max_altitude_m REAL,
    max_range_km REAL,
    max_speed_mps REAL,
    min_speed_mps REAL,
    max_payload_kg REAL,
    weather_conditions JSONB, -- Wind, temperature, humidity limits
    altitude_effects JSONB, -- Performance at different altitudes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team collaboration
CREATE TABLE design_collaborations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    role VARCHAR(50), -- 'owner', 'editor', 'viewer', 'reviewer'
    permissions JSONB,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(build_id, user_id)
);

-- ========================================
-- 2. SIMULATE & VALIDATE STAGE TABLES
-- ========================================

-- Simulation configurations
CREATE TABLE simulation_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    simulation_type VARCHAR(50) NOT NULL, -- 'px4', 'gazebo', 'custom'
    config_file_path VARCHAR(500),
    parameters JSONB,
    environment_settings JSONB, -- Weather, terrain, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Simulation results
CREATE TABLE simulation_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simulation_config_id UUID REFERENCES simulation_configs(id) ON DELETE CASCADE,
    flight_time_seconds INTEGER,
    distance_meters REAL,
    max_speed_mps REAL,
    avg_speed_mps REAL,
    energy_consumption_wh REAL,
    stability_score REAL,
    performance_metrics JSONB,
    result_file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mission profiles for testing
CREATE TABLE mission_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    waypoints JSONB,
    altitude_profile JSONB,
    speed_profile JSONB,
    payload_config JSONB,
    weather_conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Thermal analysis results
CREATE TABLE thermal_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    component_temperatures JSONB, -- Temperature readings for each component
    thermal_zones JSONB, -- Hot spots and cooling areas
    cooling_recommendations TEXT[],
    max_temperature_c REAL,
    avg_temperature_c REAL,
    thermal_efficiency_score REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMI analysis results
CREATE TABLE emi_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    interference_sources JSONB,
    affected_components JSONB,
    mitigation_strategies TEXT[],
    emi_score REAL, -- 0-100, lower is better
    compliance_status VARCHAR(50), -- 'compliant', 'needs_improvement', 'non_compliant'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PID tuning presets
CREATE TABLE pid_presets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    flight_controller_type VARCHAR(50), -- 'betaflight', 'inav', 'ardupilot', 'px4'
    p_roll REAL,
    i_roll REAL,
    d_roll REAL,
    p_pitch REAL,
    i_pitch REAL,
    d_pitch REAL,
    p_yaw REAL,
    i_yaw REAL,
    d_yaw REAL,
    use_case VARCHAR(50), -- 'racing', 'cinematic', 'long_range', 'freestyle'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ========================================
-- 3. BUILD STAGE TABLES
-- ========================================

-- Parts ordering integration
CREATE TABLE parts_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    supplier VARCHAR(100), -- 'getfpv', 'aliexpress', 'banggood', 'amazon'
    order_number VARCHAR(255),
    order_status VARCHAR(50), -- 'pending', 'confirmed', 'shipped', 'delivered'
    total_cost_usd DECIMAL(10,2),
    shipping_cost_usd DECIMAL(10,2),
    estimated_delivery_date DATE,
    tracking_number VARCHAR(255),
    order_items JSONB, -- List of ordered components
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- BOM (Bill of Materials) exports
CREATE TABLE bom_exports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    export_format VARCHAR(50), -- 'pdf', 'json', 'kicad', 'csv'
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    total_cost_usd DECIMAL(10,2),
    total_weight_grams REAL,
    component_count INTEGER,
    export_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Assembly instructions
CREATE TABLE assembly_instructions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_path VARCHAR(500),
    video_path VARCHAR(500),
    estimated_time_minutes INTEGER,
    required_tools TEXT[],
    required_components JSONB,
    difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wiring diagrams
CREATE TABLE wiring_diagrams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    diagram_type VARCHAR(50), -- 'power', 'signal', 'complete'
    diagram_file_path VARCHAR(500),
    diagram_format VARCHAR(20), -- 'svg', 'png', 'pdf'
    wire_specifications JSONB, -- Wire types, lengths, colors
    connection_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3D printable files
CREATE TABLE printable_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_format VARCHAR(20), -- 'stl', 'obj', '3mf'
    print_settings JSONB, -- Layer height, infill, support settings
    estimated_print_time_hours REAL,
    material_requirements JSONB,
    print_difficulty VARCHAR(20), -- 'easy', 'medium', 'hard'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Build progress tracking
CREATE TABLE build_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    stage VARCHAR(50), -- 'planning', 'ordering', 'assembly', 'testing', 'complete'
    progress_percent INTEGER DEFAULT 0,
    current_step VARCHAR(255),
    notes TEXT,
    photos JSONB, -- Array of photo paths
    time_spent_minutes INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- ========================================
-- 4. DEPLOY & OPERATE STAGE TABLES
-- ========================================

-- Flight controller configurations
CREATE TABLE flight_controller_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    controller_type VARCHAR(50), -- 'px4', 'ardupilot', 'betaflight', 'inav'
    config_file_path VARCHAR(500),
    config_parameters JSONB,
    firmware_version VARCHAR(100),
    backup_config_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Companion computer setups
CREATE TABLE companion_computer_setups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    computer_type VARCHAR(50), -- 'raspberry_pi', 'jetson_nano', 'orange_cube'
    os_version VARCHAR(100),
    software_stack JSONB, -- ROS, MAVROS, etc.
    setup_instructions TEXT,
    configuration_files JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Mission planning
CREATE TABLE missions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    mission_name VARCHAR(255) NOT NULL,
    mission_type VARCHAR(50), -- 'surveillance', 'mapping', 'delivery', 'racing'
    waypoints JSONB,
    altitude_profile JSONB,
    speed_profile JSONB,
    payload_config JSONB,
    weather_conditions JSONB,
    safety_parameters JSONB,
    mission_file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Ground Control Station integrations
CREATE TABLE gcs_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    gcs_type VARCHAR(50), -- 'qgroundcontrol', 'mavproxy', 'mission_planner'
    connection_settings JSONB,
    telemetry_config JSONB,
    mission_upload_status VARCHAR(50),
    last_connection TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telemetry data
CREATE TABLE telemetry_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    flight_session_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    gps_lat REAL,
    gps_lon REAL,
    altitude_m REAL,
    speed_mps REAL,
    battery_percent REAL,
    battery_voltage REAL,
    current_amp REAL,
    temperature_c REAL,
    attitude_data JSONB, -- Roll, pitch, yaw
    sensor_data JSONB, -- IMU, barometer, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. MAINTAIN & SCALE STAGE TABLES
-- ========================================

-- Fleet management
CREATE TABLE fleet (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fleet_type VARCHAR(50), -- 'commercial', 'research', 'hobby', 'enterprise'
    total_drones INTEGER DEFAULT 0,
    active_drones INTEGER DEFAULT 0,
    maintenance_due INTEGER DEFAULT 0,
    total_flight_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Fleet drones
CREATE TABLE fleet_drones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fleet_id UUID REFERENCES fleet(id) ON DELETE CASCADE,
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    drone_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'maintenance', 'retired', 'crashed'
    total_flight_hours INTEGER DEFAULT 0,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    battery_cycles INTEGER DEFAULT 0,
    crash_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance logs
CREATE TABLE maintenance_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fleet_drone_id UUID REFERENCES fleet_drones(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50), -- 'routine', 'repair', 'upgrade', 'inspection'
    description TEXT,
    parts_replaced JSONB,
    cost_usd DECIMAL(10,2),
    technician_notes TEXT,
    maintenance_date DATE,
    next_maintenance_date DATE,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battery management
CREATE TABLE battery_management (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fleet_drone_id UUID REFERENCES fleet_drones(id) ON DELETE CASCADE,
    battery_serial VARCHAR(255),
    battery_type VARCHAR(100),
    capacity_mah INTEGER,
    cycle_count INTEGER DEFAULT 0,
    max_cycles INTEGER,
    health_percent REAL,
    last_charge_date TIMESTAMP WITH TIME ZONE,
    last_discharge_date TIMESTAMP WITH TIME ZONE,
    storage_voltage REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Software updates
CREATE TABLE software_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fleet_drone_id UUID REFERENCES fleet_drones(id) ON DELETE CASCADE,
    update_type VARCHAR(50), -- 'firmware', 'software', 'configuration'
    version_from VARCHAR(100),
    version_to VARCHAR(100),
    update_status VARCHAR(50), -- 'pending', 'in_progress', 'completed', 'failed'
    update_log TEXT,
    rollback_available BOOLEAN DEFAULT FALSE,
    update_date TIMESTAMP WITH TIME ZONE,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance analytics
CREATE TABLE performance_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fleet_drone_id UUID REFERENCES fleet_drones(id) ON DELETE CASCADE,
    date DATE,
    total_flights INTEGER,
    total_flight_time_minutes INTEGER,
    avg_flight_time_minutes REAL,
    total_distance_km REAL,
    avg_speed_mps REAL,
    battery_efficiency_percent REAL,
    maintenance_incidents INTEGER,
    reliability_score REAL, -- 0-100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Digital twin integration
CREATE TABLE digital_twins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fleet_drone_id UUID REFERENCES fleet_drones(id) ON DELETE CASCADE,
    twin_platform VARCHAR(100), -- 'azure', 'aws', 'custom'
    twin_id VARCHAR(255),
    connection_status VARCHAR(50), -- 'connected', 'disconnected', 'error'
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_frequency_minutes INTEGER,
    twin_configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Component specs indexes
CREATE INDEX idx_component_specs_type ON component_specs(component_type);
CREATE INDEX idx_component_specs_manufacturer ON component_specs(manufacturer);
CREATE INDEX idx_component_specs_specifications ON component_specs USING GIN(specifications);

-- Battery specs indexes
CREATE INDEX idx_battery_specs_capacity ON battery_specs(capacity_mah);
CREATE INDEX idx_battery_specs_voltage ON battery_specs(voltage_cells);
CREATE INDEX idx_battery_specs_manufacturer ON battery_specs(manufacturer);

-- Power analysis indexes
CREATE INDEX idx_power_analysis_build_id ON power_analysis(build_id);
CREATE INDEX idx_power_analysis_flight_time ON power_analysis(estimated_flight_time_min);

-- CAD exports indexes
CREATE INDEX idx_cad_exports_build_id ON cad_exports(build_id);
CREATE INDEX idx_cad_exports_type ON cad_exports(export_type);

-- Flight envelopes indexes
CREATE INDEX idx_flight_envelopes_build_id ON flight_envelopes(build_id);
CREATE INDEX idx_flight_envelopes_payload ON flight_envelopes(max_payload_kg);

-- Simulation indexes
CREATE INDEX idx_simulation_configs_build_id ON simulation_configs(build_id);
CREATE INDEX idx_simulation_configs_type ON simulation_configs(simulation_type);
CREATE INDEX idx_simulation_results_config_id ON simulation_results(simulation_config_id);

-- PID presets indexes
CREATE INDEX idx_pid_presets_controller_type ON pid_presets(flight_controller_type);
CREATE INDEX idx_pid_presets_use_case ON pid_presets(use_case);

-- Parts orders indexes
CREATE INDEX idx_parts_orders_build_id ON parts_orders(build_id);
CREATE INDEX idx_parts_orders_supplier ON parts_orders(supplier);
CREATE INDEX idx_parts_orders_status ON parts_orders(order_status);

-- Fleet indexes
CREATE INDEX idx_fleet_drones_fleet_id ON fleet_drones(fleet_id);
CREATE INDEX idx_fleet_drones_status ON fleet_drones(status);
CREATE INDEX idx_fleet_drones_maintenance ON fleet_drones(next_maintenance_date);

-- Maintenance indexes
CREATE INDEX idx_maintenance_logs_drone_id ON maintenance_logs(fleet_drone_id);
CREATE INDEX idx_maintenance_logs_date ON maintenance_logs(maintenance_date);

-- Battery management indexes
CREATE INDEX idx_battery_management_drone_id ON battery_management(fleet_drone_id);
CREATE INDEX idx_battery_management_health ON battery_management(health_percent);

-- Telemetry indexes
CREATE INDEX idx_telemetry_data_build_id ON telemetry_data(build_id);
CREATE INDEX idx_telemetry_data_timestamp ON telemetry_data(timestamp);
CREATE INDEX idx_telemetry_data_session ON telemetry_data(flight_session_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE component_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cad_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE thermal_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pid_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assembly_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiring_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE printable_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_controller_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE companion_computer_setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gcs_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_drones ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_twins ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
-- Note: In a real implementation, you'd want more sophisticated policies

-- Component specs - viewable by everyone, editable by admins
CREATE POLICY "Component specs viewable by everyone" ON component_specs FOR SELECT USING (true);

-- Battery specs - viewable by everyone
CREATE POLICY "Battery specs viewable by everyone" ON battery_specs FOR SELECT USING (true);

-- Power analysis - users can only access their own builds
CREATE POLICY "Power analysis by build owner" ON power_analysis
    FOR ALL USING (
        build_id IN (
            SELECT id FROM builds WHERE user_id = auth.uid()
        )
    );

-- CAD exports - users can only access their own builds
CREATE POLICY "CAD exports by build owner" ON cad_exports
    FOR ALL USING (
        build_id IN (
            SELECT id FROM builds WHERE user_id = auth.uid()
        )
    );

-- Flight envelopes - users can only access their own builds
CREATE POLICY "Flight envelopes by build owner" ON flight_envelopes
    FOR ALL USING (
        build_id IN (
            SELECT id FROM builds WHERE user_id = auth.uid()
        )
    );

-- Design collaborations - users can access builds they're collaborating on
CREATE POLICY "Design collaborations by participant" ON design_collaborations
    FOR ALL USING (
        user_id = auth.uid() OR
        build_id IN (
            SELECT id FROM builds WHERE user_id = auth.uid()
        )
    );

-- Fleet - users can only access their own fleets
CREATE POLICY "Fleet by owner" ON fleet
    FOR ALL USING (created_by = auth.uid());

-- Fleet drones - users can only access their own fleet drones
CREATE POLICY "Fleet drones by fleet owner" ON fleet_drones
    FOR ALL USING (
        fleet_id IN (
            SELECT id FROM fleet WHERE created_by = auth.uid()
        )
    );

-- Maintenance logs - users can only access their own fleet maintenance
CREATE POLICY "Maintenance logs by fleet owner" ON maintenance_logs
    FOR ALL USING (
        fleet_drone_id IN (
            SELECT fd.id FROM fleet_drones fd
            JOIN fleet f ON fd.fleet_id = f.id
            WHERE f.created_by = auth.uid()
        )
    );

-- Telemetry data - users can only access their own builds
CREATE POLICY "Telemetry data by build owner" ON telemetry_data
    FOR ALL USING (
        build_id IN (
            SELECT id FROM builds WHERE user_id = auth.uid()
        )
    );

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to calculate flight time based on battery and power draw
CREATE OR REPLACE FUNCTION calculate_flight_time(
    battery_capacity_mah INTEGER,
    voltage_cells INTEGER,
    total_power_draw_w REAL
)
RETURNS INTEGER AS $$
DECLARE
    battery_capacity_wh REAL;
    flight_time_minutes INTEGER;
BEGIN
    battery_capacity_wh := (battery_capacity_mah * voltage_cells * 3.7) / 1000;
    flight_time_minutes := (battery_capacity_wh / total_power_draw_w) * 60;
    RETURN flight_time_minutes;
END;
$$ LANGUAGE plpgsql;

-- Function to get build statistics
CREATE OR REPLACE FUNCTION get_build_stats(build_uuid UUID)
RETURNS TABLE (
    total_cost_usd DECIMAL(10,2),
    total_weight_grams REAL,
    estimated_flight_time_min INTEGER,
    max_payload_kg REAL,
    component_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(c.price_usd), 0) as total_cost_usd,
        COALESCE(SUM(c.weight_grams), 0) as total_weight_grams,
        COALESCE(pa.estimated_flight_time_min, 0) as estimated_flight_time_min,
        COALESCE(fe.max_payload_kg, 0) as max_payload_kg,
        COUNT(c.id) as component_count
    FROM builds b
    LEFT JOIN build_components bc ON b.id = bc.build_id
    LEFT JOIN component_specs c ON bc.component_id = c.id
    LEFT JOIN power_analysis pa ON b.id = pa.build_id
    LEFT JOIN flight_envelopes fe ON b.id = fe.build_id
    WHERE b.id = build_uuid
    GROUP BY pa.estimated_flight_time_min, fe.max_payload_kg;
END;
$$ LANGUAGE plpgsql;

-- Function to get fleet statistics
CREATE OR REPLACE FUNCTION get_fleet_stats(fleet_uuid UUID)
RETURNS TABLE (
    total_drones INTEGER,
    active_drones INTEGER,
    maintenance_due INTEGER,
    total_flight_hours INTEGER,
    avg_reliability_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(fd.id) as total_drones,
        COUNT(CASE WHEN fd.status = 'active' THEN 1 END) as active_drones,
        COUNT(CASE WHEN fd.next_maintenance_date <= CURRENT_DATE THEN 1 END) as maintenance_due,
        COALESCE(SUM(fd.total_flight_hours), 0) as total_flight_hours,
        COALESCE(AVG(pa.reliability_score), 0) as avg_reliability_score
    FROM fleet f
    LEFT JOIN fleet_drones fd ON f.id = fd.fleet_id
    LEFT JOIN performance_analytics pa ON fd.id = pa.fleet_drone_id
    WHERE f.id = fleet_uuid
    GROUP BY f.id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_component_specs_updated_at
    BEFORE UPDATE ON component_specs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update fleet statistics when drones are added/removed
CREATE OR REPLACE FUNCTION update_fleet_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE fleet 
        SET total_drones = total_drones + 1,
            active_drones = active_drones + CASE WHEN NEW.status = 'active' THEN 1 ELSE 0 END
        WHERE id = NEW.fleet_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != NEW.status THEN
            UPDATE fleet 
            SET active_drones = active_drones + 
                CASE WHEN NEW.status = 'active' THEN 1 ELSE 0 END -
                CASE WHEN OLD.status = 'active' THEN 1 ELSE 0 END
            WHERE id = NEW.fleet_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE fleet 
        SET total_drones = total_drones - 1,
            active_drones = active_drones - CASE WHEN OLD.status = 'active' THEN 1 ELSE 0 END
        WHERE id = OLD.fleet_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fleet_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON fleet_drones
    FOR EACH ROW
    EXECUTE FUNCTION update_fleet_stats();

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample component specifications
INSERT INTO component_specs (component_type, name, manufacturer, specifications, compatibility_rules, price_range) VALUES
('motor', 'T-Motor U11-II KV120', 'T-Motor', 
 '{"weight_grams": 320, "max_power_w": 1200, "kv": 120, "max_current_a": 30, "shaft_diameter_mm": 8}',
 '{"propeller_size_inch": [18, 20, 22], "voltage_range_v": [6, 12]}',
 '{"min_usd": 89, "max_usd": 95, "currency": "USD"}'),
('esc', 'T-Motor FLAME 80A', 'T-Motor',
 '{"max_current_a": 80, "voltage_range_v": [6, 12], "weight_grams": 45, "protocol": "DShot600"}',
 '{"motor_kv_range": [80, 200], "battery_cells": [6, 12]}',
 '{"min_usd": 45, "max_usd": 55, "currency": "USD"}'),
('frame', 'Tarot FY680 Pro', 'Tarot',
 '{"weight_grams": 850, "arm_length_mm": 680, "material": "carbon_fiber", "max_propeller_inch": 15}',
 '{"motor_count": [6, 8], "propeller_size_inch": [12, 15]}',
 '{"min_usd": 120, "max_usd": 150, "currency": "USD"}');

-- Insert sample battery specifications
INSERT INTO battery_specs (capacity_mah, voltage_cells, discharge_rate_c, weight_grams, dimensions_mm, chemistry, cycle_life, max_charge_rate_c, price_usd, manufacturer, model) VALUES
(6000, 6, 30, 850, '{"length": 140, "width": 45, "height": 60}', 'LiPo', 300, 5, 89.99, 'Tattu', '6S 6000mAh 30C'),
(4000, 4, 45, 450, '{"length": 110, "width": 35, "height": 45}', 'LiPo', 250, 5, 49.99, 'Tattu', '4S 4000mAh 45C'),
(10000, 6, 20, 1200, '{"length": 160, "width": 50, "height": 70}', 'LiPo', 400, 3, 129.99, 'Tattu', '6S 10000mAh 20C');

-- Insert sample PID presets
INSERT INTO pid_presets (name, description, flight_controller_type, p_roll, i_roll, d_roll, p_pitch, i_pitch, d_pitch, p_yaw, i_yaw, d_yaw, use_case, created_by) VALUES
('Racing Profile', 'Aggressive settings for racing drones', 'betaflight', 1.2, 0.05, 0.08, 1.2, 0.05, 0.08, 1.0, 0.03, 0.0, 'racing', (SELECT id FROM auth.users LIMIT 1)),
('Cinematic Profile', 'Smooth settings for cinematic flying', 'betaflight', 0.8, 0.03, 0.12, 0.8, 0.03, 0.12, 0.9, 0.02, 0.0, 'cinematic', (SELECT id FROM auth.users LIMIT 1)),
('Long Range Profile', 'Stable settings for long range flights', 'ardupilot', 1.0, 0.04, 0.10, 1.0, 0.04, 0.10, 1.1, 0.03, 0.0, 'long_range', (SELECT id FROM auth.users LIMIT 1));

-- Comments for documentation
COMMENT ON TABLE component_specs IS 'Detailed specifications for drone components with compatibility rules';
COMMENT ON TABLE battery_specs IS 'Battery specifications for power analysis and optimization';
COMMENT ON TABLE power_analysis IS 'Power consumption analysis for flight time estimation';
COMMENT ON TABLE cad_exports IS 'CAD file exports for 3D printing and manufacturing';
COMMENT ON TABLE flight_envelopes IS 'Flight performance envelopes and limitations';
COMMENT ON TABLE design_collaborations IS 'Team collaboration for drone design projects';
COMMENT ON TABLE simulation_configs IS 'Simulation configurations for PX4, Gazebo, etc.';
COMMENT ON TABLE simulation_results IS 'Results from flight simulations and performance tests';
COMMENT ON TABLE mission_profiles IS 'Predefined mission profiles for testing and validation';
COMMENT ON TABLE thermal_analysis IS 'Thermal analysis results for component cooling';
COMMENT ON TABLE emi_analysis IS 'Electromagnetic interference analysis results';
COMMENT ON TABLE pid_presets IS 'PID tuning presets for different flight controllers and use cases';
COMMENT ON TABLE parts_orders IS 'Parts ordering integration with suppliers';
COMMENT ON TABLE bom_exports IS 'Bill of Materials exports in various formats';
COMMENT ON TABLE assembly_instructions IS 'Step-by-step assembly instructions';
COMMENT ON TABLE wiring_diagrams IS 'Wiring diagrams and electrical schematics';
COMMENT ON TABLE printable_files IS '3D printable files for custom parts';
COMMENT ON TABLE build_progress IS 'Build progress tracking and time management';
COMMENT ON TABLE flight_controller_configs IS 'Flight controller configuration files';
COMMENT ON TABLE companion_computer_setups IS 'Companion computer setup guides and configurations';
COMMENT ON TABLE missions IS 'Mission planning and waypoint definitions';
COMMENT ON TABLE gcs_integrations IS 'Ground Control Station integration settings';
COMMENT ON TABLE telemetry_data IS 'Real-time telemetry data from flights';
COMMENT ON TABLE fleet IS 'Fleet management for multiple drones';
COMMENT ON TABLE fleet_drones IS 'Individual drones within a fleet';
COMMENT ON TABLE maintenance_logs IS 'Maintenance history and scheduling';
COMMENT ON TABLE battery_management IS 'Battery lifecycle and health tracking';
COMMENT ON TABLE software_updates IS 'Software and firmware update tracking';
COMMENT ON TABLE performance_analytics IS 'Performance analytics and reliability metrics';
COMMENT ON TABLE digital_twins IS 'Digital twin integration for enterprise operations'; 