const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        console.log('🔍 تست اتصال به دیتابیس...');

        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '1234',
            database: 'crm_system'
        });

        console.log('✅ اتصال به دیتابیس موفق بود!');

        // تست یک کوئری ساده
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`📊 تعداد کاربران: ${rows[0].count}`);

        await connection.end();
        console.log('✅ تست کامل شد - Next.js می‌تونه به دیتابیس Docker وصل بشه');

    } catch (error) {
        console.error('❌ خطا در اتصال به دیتابیس:');
        console.error(error.message);
        process.exit(1);
    }
}

testConnection();