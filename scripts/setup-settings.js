const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    user: 'root',
    password: '1234',
    database: 'crm_system',
    timezone: '+00:00',
    charset: 'utf8mb4',
};

async function setupSettingsTables() {
    let connection;

    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'create-settings-tables.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        // Split SQL content by semicolons and execute each statement
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`🔄 Executing ${statements.length} SQL statements...`);

        for (const statement of statements) {
            try {
                await connection.execute(statement);
                console.log('✅ Executed:', statement.substring(0, 50) + '...');
            } catch (error) {
                console.error('❌ Error executing statement:', statement.substring(0, 50) + '...');
                console.error('Error:', error.message);
            }
        }

        console.log('✅ Settings tables setup completed successfully!');

        // Verify tables were created
        const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'crm_system' 
      AND TABLE_NAME IN ('system_settings', 'backup_history', 'system_logs')
    `);

        console.log('📋 Created tables:', tables.map(t => t.TABLE_NAME).join(', '));

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run setup
setupSettingsTables();