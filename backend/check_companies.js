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

async function checkCompanies() {
  try {
    console.log('Connecting to database...');
    await sql.connect(dbConfig);
    console.log('Connected successfully!');
    
    // Check what companies exist
    console.log('\nChecking existing companies...');
    const request = new sql.Request();
    const result = await request.query(`
      SELECT 
        CompanyID, 
        Name, 
        NTNNumber, 
        IsActive,
        FBRToken,
        CASE 
          WHEN FBRToken IS NOT NULL AND LEN(FBRToken) > 0 THEN 'Yes' 
          ELSE 'No' 
        END as HasFBRToken
      FROM Companies 
      ORDER BY Name
    `);
    
    if (result.recordset.length === 0) {
      console.log('❌ No companies found in database!');
    } else {
      console.log(`✅ Found ${result.recordset.length} companies:`);
      result.recordset.forEach((company, index) => {
        console.log(`\n${index + 1}. Company ID: ${company.CompanyID}`);
        console.log(`   Name: ${company.Name}`);
        console.log(`   NTN: ${company.NTNNumber}`);
        console.log(`   Active: ${company.IsActive ? 'Yes' : 'No'}`);
        console.log(`   Has FBR Token: ${company.HasFBRToken}`);
        if (company.FBRToken) {
          console.log(`   FBR Token: ${company.FBRToken.substring(0, 20)}...`);
        }
      });
    }
    
    // Also check users table to see what company IDs are referenced
    console.log('\n\nChecking users and their company associations...');
    const userResult = await request.query(`
      SELECT 
        u.UserID,
        u.Username,
        u.Role,
        u.CompanyID,
        c.Name as CompanyName
      FROM Users u
      LEFT JOIN Companies c ON u.CompanyID = c.CompanyID
      ORDER BY u.Username
    `);
    
    if (userResult.recordset.length === 0) {
      console.log('❌ No users found in database!');
    } else {
      console.log(`✅ Found ${userResult.recordset.length} users:`);
      userResult.recordset.forEach((user, index) => {
        console.log(`\n${index + 1}. Username: ${user.Username}`);
        console.log(`   Role: ${user.Role}`);
        console.log(`   Company ID: ${user.CompanyID || 'None'}`);
        console.log(`   Company Name: ${user.CompanyName || 'None'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.close();
    console.log('\nDatabase connection closed.');
  }
}

checkCompanies().catch(console.error);