const sql = require('mssql');
const bcrypt = require('bcrypt');
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

async function initializeSuperAdmin() {
  try {
    console.log('Connecting to database...');
    await sql.connect(dbConfig);
    console.log('Connected successfully!');
    
    // Check if superadmin user already exists
    console.log('Checking if superadmin user exists...');
    const existingUser = await sql.query`
      SELECT UserID FROM Users WHERE Username = 'superadmin'
    `;
    
    if (existingUser.recordset.length > 0) {
      console.log('✅ Superadmin user already exists');
      
      // Update password to ensure it's 'admin123'
      console.log('Updating superadmin password to admin123...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      await sql.query`
        UPDATE Users 
        SET PasswordHash = ${hashedPassword}, UpdatedAt = GETDATE()
        WHERE Username = 'superadmin'
      `;
      
      console.log('✅ Superadmin password updated successfully!');
    } else {
      console.log('Creating superadmin user...');
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      // Insert superadmin user
      await sql.query`
        INSERT INTO Users (Username, PasswordHash, Role, IsActive, CreatedAt, UpdatedAt)
        VALUES ('superadmin', ${hashedPassword}, 'SUPER_ADMIN', 1, GETDATE(), GETDATE())
      `;
      
      console.log('✅ Superadmin user created successfully!');
    }
    
    // Verify the user was created/updated
    const verifyUser = await sql.query`
      SELECT UserID, Username, Role, IsActive 
      FROM Users 
      WHERE Username = 'superadmin'
    `;
    
    if (verifyUser.recordset.length > 0) {
      const user = verifyUser.recordset[0];
      console.log('\n✅ Superadmin user verified:');
      console.log(`- UserID: ${user.UserID}`);
      console.log(`- Username: ${user.Username}`);
      console.log(`- Role: ${user.Role}`);
      console.log(`- IsActive: ${user.IsActive}`);
      console.log('\n🔑 Login credentials:');
      console.log('Username: superadmin');
      console.log('Password: admin123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.close();
    console.log('\nDatabase connection closed.');
  }
}

initializeSuperAdmin();