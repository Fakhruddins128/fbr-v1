-- Import FBR Sandbox Testing Scenarios
-- This script populates the scenario mapping table with official FBR scenarios

USE FBR_SaaS;
GO

-- Insert FBR Sandbox Testing Scenarios
INSERT INTO ScenarioMapping (business_activity, sector, applicable_scenarios, is_active, created_at, updated_at)
VALUES
-- Standard Rate Scenarios
('Goods at standard rate to registered buyers', 'Cotton Ginners', '["SN001", "SN002"]', 1, GETDATE(), GETDATE()),
('Goods at standard rate to unregistered buyers', 'Cotton Ginners', '["SN002"]', 1, GETDATE(), GETDATE()),
('Sale of Steel (Melted and Re-Rolled)', 'Steel Manufacturing', '["SN003"]', 1, GETDATE(), GETDATE()),
('Sale by Ship Breakers', 'Ship Breaking', '["SN004"]', 1, GETDATE(), GETDATE()),
('Reduced rate sale', 'Goods at Reduced Rate', '["SN005"]', 1, GETDATE(), GETDATE()),
('Exempt goods sale', 'Exempt Goods', '["SN006"]', 1, GETDATE(), GETDATE()),
('Reduced rate sale', 'Goods at Zero Rate', '["SN007"]', 1, GETDATE(), GETDATE()),
('Sale of 3rd schedule goods', '3rd Schedule Goods', '["SN008"]', 1, GETDATE(), GETDATE()),
('Cotton Ginners purchase from Cotton Ginners (Textile Sector)', 'Cotton Ginners', '["SN009"]', 1, GETDATE(), GETDATE()),

-- Service Scenarios
('Telecom services rendered or provided', 'Telecommunication Services', '["SN010"]', 1, GETDATE(), GETDATE()),
('Toll Manufacturing sale by Steel sector', 'Toll Manufacturing', '["SN011"]', 1, GETDATE(), GETDATE()),
('Sale of Petroleum products', 'Petroleum Products', '["SN012"]', 1, GETDATE(), GETDATE()),
('Electricity Supply to Retailers', 'Electricity Supply to Retailers', '["SN013"]', 1, GETDATE(), GETDATE()),
('Sale of Gas to CNG stations', 'Gas for CNG stations', '["SN014"]', 1, GETDATE(), GETDATE()),
('Sale of mobile phones', 'Mobile Phones', '["SN015"]', 1, GETDATE(), GETDATE()),
('Processing/conversion of Goods', 'Processing/Conversion of Goods', '["SN016"]', 1, GETDATE(), GETDATE()),
('Sale of goods where FED is charged in ST mode', 'Goods (FED in ST Mode)', '["SN017"]', 1, GETDATE(), GETDATE()),
('Services rendered or provided where FED is charged in ST mode', 'Services (FED in ST Mode)', '["SN018"]', 1, GETDATE(), GETDATE()),
('Services rendered or provided', 'Services', '["SN019"]', 1, GETDATE(), GETDATE()),
('Sale of Electric Vehicles', 'Electric Vehicle', '["SN020"]', 1, GETDATE(), GETDATE()),
('Sale of Cement /Concrete Block', 'Cement/Concrete Block', '["SN021"]', 1, GETDATE(), GETDATE()),
('Sale of Potassium Chlorate', 'Potassium Chlorate', '["SN022"]', 1, GETDATE(), GETDATE()),
('Sale of LNG', 'LNG Sales', '["SN023"]', 1, GETDATE(), GETDATE()),
('Goods sold that are listed in SRO 29/TI/2023', 'Goods as per SRO 29/TI/2023', '["SN024"]', 1, GETDATE(), GETDATE()),

-- Special Rate Scenarios
('Sale of goods at 8% rate under serial 83 of Eighth Schedule Table 1', 'Non-Luxury Supplies', '["SN025"]', 1, GETDATE(), GETDATE()),
('Sale to End Consumer by retailers', 'Goods at Standard Rate (default)', '["SN026"]', 1, GETDATE(), GETDATE()),
('Sale to End Consumer by retailers', '3rd Schedule Goods', '["SN027"]', 1, GETDATE(), GETDATE()),
('Sale to End Consumer by retailers', 'Goods at Reduced Rate', '["SN028"]', 1, GETDATE(), GETDATE());

GO

-- Verify the inserted data
SELECT 
    business_activity,
    sector,
    applicable_scenarios,
    is_active,
    created_at
FROM ScenarioMapping
WHERE created_at >= CAST(GETDATE() AS DATE)
ORDER BY business_activity, sector;

PRINT 'FBR Sandbox Testing Scenarios imported successfully!';
PRINT 'Total scenarios imported: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
GO