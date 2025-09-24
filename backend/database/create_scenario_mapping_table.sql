-- Create ScenarioMapping table for storing Business Activity, Sector, and applicable scenarios
USE FBR_SaaS;
GO

-- Drop table if exists and recreate
IF OBJECT_ID('ScenarioMapping', 'U') IS NOT NULL
    DROP TABLE ScenarioMapping;
GO

CREATE TABLE ScenarioMapping (
    id INT PRIMARY KEY IDENTITY(1,1),
    business_activity NVARCHAR(100) NOT NULL,
    sector NVARCHAR(100) NOT NULL,
    applicable_scenarios NVARCHAR(MAX) NOT NULL, -- JSON array of scenario codes
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Create index for faster lookups
CREATE INDEX IX_ScenarioMapping_BusinessActivity_Sector 
ON ScenarioMapping (business_activity, sector);
GO

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER TR_ScenarioMapping_UpdatedAt
ON ScenarioMapping
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ScenarioMapping
    SET updated_at = GETDATE()
    FROM ScenarioMapping sm
    INNER JOIN inserted i ON sm.id = i.id;
END;
GO

PRINT 'ScenarioMapping table created successfully!';
GO