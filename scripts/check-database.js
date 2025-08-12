const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    user: 'root',
    password: '1234',
    database: 'crm_system',
    timezone: '+00:00',
    charset: 'utf8mb4',
};

async function checkDatabase() {
    let connection;

    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Get all tables
        const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'crm_system'
      ORDER BY TABLE_NAME
    `);

        console.log('\n📋 Database Tables:');
        console.log('==================');
        tables.forEach(table => {
            const sizeKB = Math.round((table.DATA_LENGTH + table.INDEX_LENGTH) / 1024);
            console.log(`${table.TABLE_NAME}: ${table.TABLE_ROWS} rows, ${sizeKB} KB`);
        });

        // Get database size
        const [sizeResult] = await connection.execute(`
      SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = 'crm_system'
    `);

        console.log(`\n💾 Total Database Size: ${sizeResult[0].size_mb} MB`);

        // Check if users table exists and has data
        try {
            const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
            console.log(`👥 Total Users: ${users[0].count}`);
        } catch (error) {
            console.log('👥 Users table not found or empty');
        }

        // Check customers
        try {
            const [customers] = await connection.execute('SELECT COUNT(*) as count FROM customers');
            console.log(`🏢 Total Customers: ${customers[0].count}`);
        } catch (error) {
            console.log('🏢 Customers table not found or empty');
        }

        // Check system settings
        try {
            const [settings] = await connection.execute('SELECT setting_key FROM system_settings');
            console.log(`⚙️ System Settings: ${settings.map(s => s.setting_key).join(', ')}`);
        } catch (error) {
            console.log('⚙️ System settings table not found');
        }

    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

checkDatabase();