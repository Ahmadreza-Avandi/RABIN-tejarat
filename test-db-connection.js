const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log('🔍 Testing database connection...');
    console.log('📊 Database Config:');
    console.log(`   Host: ${process.env.DATABASE_HOST}`);
    console.log(`   User: ${process.env.DATABASE_USER}`);
    console.log(`   Database: ${process.env.DATABASE_NAME}`);
    console.log(`   URL: ${process.env.DATABASE_URL}`);

    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        });

        console.log('✅ Successfully connected to MySQL!');

        // Test query
        const [rows] = await connection.execute('SELECT VERSION() as version');
        console.log(`📋 MySQL Version: ${rows[0].version}`);

        // Show databases
        const [databases] = await connection.execute('SHOW DATABASES');
        console.log('📚 Available databases:');
        databases.forEach(db => console.log(`   - ${db.Database}`));

        // Show tables in our database
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📋 Tables in ${process.env.DATABASE_NAME}:`);
        if (tables.length > 0) {
            tables.forEach(table => console.log(`   - ${Object.values(table)[0]}`));
        } else {
            console.log('   No tables found');
        }

        // Test users table
        try {
            const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
            console.log(`👥 Users in database: ${users[0].count}`);
        } catch (error) {
            console.log('ℹ️  Users table not found (this is normal for first run)');
        }

        await connection.end();
        console.log('🎉 Database connection test completed successfully!');

    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);

        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Suggestions:');
            console.log('   1. Make sure MySQL is running: docker ps');
            console.log('   2. Check if port 3306 is accessible');
            console.log('   3. Run: ./setup-mysql.sh');
        }
    }
}

testConnection();