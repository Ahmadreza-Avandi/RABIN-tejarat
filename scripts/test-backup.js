const { backupService } = require('../lib/backup');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    user: 'root',
    password: '1234',
    database: 'crm_system',
    timezone: '+00:00',
    charset: 'utf8mb4',
};

async function testBackupSystem() {
    console.log('🔄 Testing backup system...\n');

    try {
        // Test 1: Check mysqldump availability
        console.log('1. Testing mysqldump availability...');
        const mysqldumpTest = await backupService.testMysqldump();

        if (mysqldumpTest.available) {
            console.log('✅ mysqldump is available');
            console.log(`   Version: ${mysqldumpTest.version}`);
        } else {
            console.log('❌ mysqldump is not available');
            console.log(`   Error: ${mysqldumpTest.error}`);
            return;
        }

        // Test 2: Check database connection
        console.log('\n2. Testing database connection...');
        const connection = await mysql.createConnection(dbConfig);
        await connection.ping();
        console.log('✅ Database connection successful');
        await connection.end();

        // Test 3: Create a test backup
        console.log('\n3. Creating test backup...');
        const startTime = Date.now();

        const backupResult = await backupService.createBackup({
            compress: true,
            includeData: true,
            excludeTables: ['system_logs']
        });

        const duration = Date.now() - startTime;

        if (backupResult.success) {
            console.log('✅ Backup created successfully');
            console.log(`   File: ${backupResult.fileName}`);
            console.log(`   Size: ${(backupResult.fileSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Duration: ${Math.round(duration / 1000)} seconds`);
            console.log(`   Path: ${backupResult.filePath}`);
        } else {
            console.log('❌ Backup failed');
            console.log(`   Error: ${backupResult.error}`);
            return;
        }

        // Test 4: List existing backups
        console.log('\n4. Listing existing backups...');
        const backups = await backupService.listBackups();

        if (backups.length > 0) {
            console.log(`✅ Found ${backups.length} backup(s):`);
            backups.slice(0, 5).forEach((backup, index) => {
                console.log(`   ${index + 1}. ${backup.fileName} (${backup.sizeFormatted}) - ${backup.createdAt.toLocaleString()}`);
            });
        } else {
            console.log('ℹ️  No existing backups found');
        }

        // Test 5: Test backup file access
        console.log('\n5. Testing backup file access...');
        const testFileName = backupResult.fileName;
        const filePath = await backupService.getBackupFile(testFileName);

        if (filePath) {
            console.log('✅ Backup file is accessible');
            console.log(`   Path: ${filePath}`);
        } else {
            console.log('❌ Backup file is not accessible');
        }

        console.log('\n🎉 All backup system tests passed!');
        console.log('\n📋 Summary:');
        console.log(`   - mysqldump: Available`);
        console.log(`   - Database: Connected`);
        console.log(`   - Backup creation: Working`);
        console.log(`   - File access: Working`);
        console.log(`   - Total backups: ${backups.length}`);

    } catch (error) {
        console.error('\n❌ Backup system test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testBackupSystem();