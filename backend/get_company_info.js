const jwt = require('jsonwebtoken');
const sql = require('mssql');

// Database configuration
const dbConfig = {
  user: 'sa',
  password: 'Acer@3456-',
  server: 'Fakhruddin-PC\\SQLSERVER',
  database: 'FBR_SaaS',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function getCompanyInfo() {
  try {
    await sql.connect(dbConfig);
    
    // Get Jafferjees Private Limited company info
    const request = new sql.Request();
    const result = await request.query(
      "SELECT CompanyID, Name, NTNNumber, CNIC, FBRToken FROM Companies WHERE Name LIKE '%Jafferjees%' OR Name LIKE '%Private Limited%'"
    );
    
    console.log('Company Information:');
    result.recordset.forEach(company => {
      console.log('Company ID:', company.CompanyID);
      console.log('Company Name:', company.Name);
      console.log('NTN Number:', company.NTNNumber);
      console.log('CNIC:', company.CNIC);
      console.log('FBR Token:', company.FBRToken ? company.FBRToken.substring(0, 20) + '...' : 'Not set');
      console.log('---');
    });
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await sql.close();
  }
}

getCompanyInfo();