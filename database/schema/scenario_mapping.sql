-- FBR Scenario Mapping Database Schema
-- This table stores the mapping between Business Activities, Sectors, and applicable FBR scenarios

-- Create scenario_mappings table
CREATE TABLE IF NOT EXISTS scenario_mappings (
    id SERIAL PRIMARY KEY,
    business_activity VARCHAR(100) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    applicable_scenarios TEXT[] NOT NULL, -- Array of scenario codes (e.g., ['SN001', 'SN002'])
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique combination of business_activity and sector
    UNIQUE(business_activity, sector)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scenario_mappings_business_activity ON scenario_mappings(business_activity);
CREATE INDEX IF NOT EXISTS idx_scenario_mappings_sector ON scenario_mappings(sector);
CREATE INDEX IF NOT EXISTS idx_scenario_mappings_combination ON scenario_mappings(business_activity, sector);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scenario_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scenario_mappings_updated_at
    BEFORE UPDATE ON scenario_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_scenario_mappings_updated_at();

-- Insert scenario mapping data based on the business logic document
INSERT INTO scenario_mappings (business_activity, sector, applicable_scenarios) VALUES
-- Manufacturing mappings
('Manufacturing', 'All Other Sectors', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024']),
('Manufacturing', 'Steel', ARRAY['SN003', 'SN004', 'SN011']),
('Manufacturing', 'FMCG', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Manufacturing', 'Textile', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Manufacturing', 'Telecom', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN010']),
('Manufacturing', 'Petroleum', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN012']),
('Manufacturing', 'Electricity Distribution', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN013']),
('Manufacturing', 'Gas Distribution', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN014']),
('Manufacturing', 'Services', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019']),
('Manufacturing', 'Automobile', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN020']),
('Manufacturing', 'CNG Stations', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN023']),
('Manufacturing', 'Pharmaceuticals', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Manufacturing', 'Wholesale/Retails', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']),

-- Importer mappings
('Importer', 'All Other Sectors', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024']),
('Importer', 'Steel', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN003', 'SN004', 'SN011']),
('Importer', 'FMCG', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Importer', 'Textile', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Importer', 'Telecom', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN010']),
('Importer', 'Petroleum', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN012']),
('Importer', 'Electricity Distribution', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN013']),
('Importer', 'Gas Distribution', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN014']),
('Importer', 'Services', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019']),
('Importer', 'Automobile', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN020']),
('Importer', 'CNG Stations', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN023']),
('Importer', 'Pharmaceuticals', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Importer', 'Wholesale/Retails', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']),

-- Distributor mappings
('Distributor', 'All Other Sectors', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'Steel', ARRAY['SN003', 'SN004', 'SN011', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'FMCG', ARRAY['SN008', 'SN026', 'SN027', 'SN028']),
('Distributor', 'Textile', ARRAY['SN009', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'Telecom', ARRAY['SN010', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'Petroleum', ARRAY['SN012', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'Electricity Distribution', ARRAY['SN013', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'Gas Distribution', ARRAY['SN014', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'Services', ARRAY['SN018', 'SN019', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'Automobile', ARRAY['SN020', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'CNG Stations', ARRAY['SN023', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'Pharmaceuticals', ARRAY['SN025', 'SN026', 'SN027', 'SN028', 'SN008']),
('Distributor', 'Wholesale/Retails', ARRAY['SN001', 'SN002', 'SN026', 'SN027', 'SN028', 'SN008']),

-- Wholesaler mappings
('Wholesaler', 'All Other Sectors', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'Steel', ARRAY['SN003', 'SN004', 'SN011', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'FMCG', ARRAY['SN008', 'SN026', 'SN027', 'SN028']),
('Wholesaler', 'Textile', ARRAY['SN009', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'Telecom', ARRAY['SN010', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'Petroleum', ARRAY['SN012', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'Electricity Distribution', ARRAY['SN013', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'Gas Distribution', ARRAY['SN014', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'Services', ARRAY['SN018', 'SN019', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'Automobile', ARRAY['SN020', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'CNG Stations', ARRAY['SN023', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'Pharmaceuticals', ARRAY['SN025', 'SN026', 'SN027', 'SN028', 'SN008']),
('Wholesaler', 'Wholesale/Retails', ARRAY['SN001', 'SN002', 'SN026', 'SN027', 'SN028', 'SN008']),

-- Exporter mappings
('Exporter', 'All Other Sectors', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024']),
('Exporter', 'Steel', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN003', 'SN004', 'SN011']),
('Exporter', 'FMCG', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Exporter', 'Textile', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Exporter', 'Telecom', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN010']),
('Exporter', 'Petroleum', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN012']),
('Exporter', 'Electricity Distribution', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN013']),
('Exporter', 'Gas Distribution', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN014']),
('Exporter', 'Services', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019']),
('Exporter', 'Automobile', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN020']),
('Exporter', 'CNG Stations', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN023']),
('Exporter', 'Pharmaceuticals', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Exporter', 'Wholesale/Retails', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']),

-- Retailer mappings
('Retailer', 'All Other Sectors', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Steel', ARRAY['SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'FMCG', ARRAY['SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Textile', ARRAY['SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Telecom', ARRAY['SN010', 'SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Petroleum', ARRAY['SN012', 'SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Electricity Distribution', ARRAY['SN013', 'SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Gas Distribution', ARRAY['SN014', 'SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Services', ARRAY['SN018', 'SN019', 'SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Automobile', ARRAY['SN020', 'SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'CNG Stations', ARRAY['SN023', 'SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Pharmaceuticals', ARRAY['SN025', 'SN026', 'SN027', 'SN028', 'SN008']),
('Retailer', 'Wholesale/Retails', ARRAY['SN026', 'SN027', 'SN028', 'SN008']),

-- Service Provider mappings
('Service Provider', 'All Other Sectors', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019']),
('Service Provider', 'Steel', ARRAY['SN003', 'SN004', 'SN011', 'SN018', 'SN019']),
('Service Provider', 'FMCG', ARRAY['SN008', 'SN018', 'SN019']),
('Service Provider', 'Textile', ARRAY['SN009', 'SN018', 'SN019']),
('Service Provider', 'Telecom', ARRAY['SN010', 'SN018', 'SN019']),
('Service Provider', 'Petroleum', ARRAY['SN012', 'SN018', 'SN019']),
('Service Provider', 'Electricity Distribution', ARRAY['SN013', 'SN018', 'SN019']),
('Service Provider', 'Gas Distribution', ARRAY['SN014', 'SN018', 'SN019']),
('Service Provider', 'Services', ARRAY['SN018', 'SN019']),
('Service Provider', 'Automobile', ARRAY['SN020', 'SN018', 'SN019']),
('Service Provider', 'CNG Stations', ARRAY['SN023', 'SN018', 'SN019']),
('Service Provider', 'Pharmaceuticals', ARRAY['SN025', 'SN018', 'SN019']),
('Service Provider', 'Wholesale/Retails', ARRAY['SN026', 'SN027', 'SN028', 'SN008', 'SN018', 'SN019']),

-- Other mappings
('Other', 'All Other Sectors', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024']),
('Other', 'Steel', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN003', 'SN004', 'SN011']),
('Other', 'FMCG', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN008']),
('Other', 'Textile', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN009']),
('Other', 'Telecom', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN010']),
('Other', 'Petroleum', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN012']),
('Other', 'Electricity Distribution', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN013']),
('Other', 'Gas Distribution', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN014']),
('Other', 'Services', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN018', 'SN019']),
('Other', 'Automobile', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN020']),
('Other', 'CNG Stations', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN023']),
('Other', 'Pharmaceuticals', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN025']),
('Other', 'Wholesale/Retails', ARRAY['SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN015', 'SN016', 'SN017', 'SN021', 'SN022', 'SN024', 'SN026', 'SN027', 'SN028', 'SN008'])

ON CONFLICT (business_activity, sector) DO UPDATE SET
    applicable_scenarios = EXCLUDED.applicable_scenarios,
    updated_at = CURRENT_TIMESTAMP;

-- Create a view for easy querying
CREATE OR REPLACE VIEW v_scenario_mappings AS
SELECT 
    id,
    business_activity,
    sector,
    applicable_scenarios,
    array_length(applicable_scenarios, 1) as scenario_count,
    created_at,
    updated_at
FROM scenario_mappings
ORDER BY business_activity, sector;

-- Function to get scenarios for multiple business activities and sectors
CREATE OR REPLACE FUNCTION get_applicable_scenarios(
    p_business_activities TEXT[],
    p_sectors TEXT[]
)
RETURNS TEXT[] AS $$
DECLARE
    result_scenarios TEXT[];
BEGIN
    SELECT ARRAY(
        SELECT DISTINCT unnest(applicable_scenarios)
        FROM scenario_mappings
        WHERE business_activity = ANY(p_business_activities)
        AND sector = ANY(p_sectors)
        ORDER BY unnest(applicable_scenarios)
    ) INTO result_scenarios;
    
    RETURN COALESCE(result_scenarios, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- Function to validate business activity and sector combination
CREATE OR REPLACE FUNCTION is_valid_combination(
    p_business_activity TEXT,
    p_sector TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM scenario_mappings
        WHERE business_activity = p_business_activity
        AND sector = p_sector
        AND array_length(applicable_scenarios, 1) > 0
    );
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE scenario_mappings IS 'Stores mapping between business activities, sectors, and applicable FBR tax scenarios';
COMMENT ON COLUMN scenario_mappings.business_activity IS 'Type of business activity (Manufacturing, Importer, etc.)';
COMMENT ON COLUMN scenario_mappings.sector IS 'Business sector (Steel, FMCG, Services, etc.)';
COMMENT ON COLUMN scenario_mappings.applicable_scenarios IS 'Array of applicable FBR scenario codes (SN001, SN002, etc.)';
COMMENT ON FUNCTION get_applicable_scenarios(TEXT[], TEXT[]) IS 'Returns unique applicable scenarios for given business activities and sectors';
COMMENT ON FUNCTION is_valid_combination(TEXT, TEXT) IS 'Validates if a business activity and sector combination exists and has scenarios';