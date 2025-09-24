const sql = require('mssql');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrongPassword',
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'FBR_SaaS',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE || undefined
  }
};

async function checkAndRunMigration() {
  try {
    console.log('Connecting to database...');
    await sql.connect(dbConfig);
    console.log('Connected successfully!');
    
    // Check if FBRToken column exists
    console.log('Checking if FBRToken column exists...');
    const checkResult = await sql.query`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Companies' AND COLUMN_NAME = 'FBRToken'
    `;
    
    if (checkResult.recordset.length > 0) {
      console.log('✅ FBRToken column already exists in Companies table');
    } else {
      console.log('❌ FBRToken column does not exist. Running migration...');
      
      // Run the migration
      await sql.query`
        ALTER TABLE Companies
        ADD FBRToken NVARCHAR(500) NULL
      `;
      
      console.log('✅ FBRToken column added successfully!');
    }
    
    // Show current Companies table structure
    console.log('\nCurrent Companies table columns:');
    const columnsResult = await sql.query`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Companies'
      ORDER BY ORDINAL_POSITION
    `;
    
    columnsResult.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.close();
    console.log('\nDatabase connection closed.');
  }
}

checkAndRunMigration();