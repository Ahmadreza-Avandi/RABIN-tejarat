const { backupService } = require('./lib/backup.ts');

async function testBackup() {
    try {
        console.log('🔄 Testing backup system...');

        // Test mysqldump availability
        const mysqldumpTest = await backupService.testMysqldump();
        console.log('📋 mysqldump test:', mysqldumpTest);

        if (!mysqldumpTest.available) {
            console.error('❌ mysqldump not available');
            return;
        }

        // Test backup creation
        console.log('🔄 Creating test backup...');
        const backupResult = await backupService.createBackup({
            compress: true,
            includeData: true,
            excludeTables: ['system_logs']
        });

        console.log('📋 Backup result:', backupResult);

        if (backupResult.success) {
            console.log('✅ Backup created successfully!');
            console.log(`📁 File: ${backupResult.fileName}`);
            console.log(`📊 Size: ${(backupResult.fileSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`⏱️ Duration: ${backupResult.duration}ms`);

            // List backups
            const backups = await backupService.listBackups();
            console.log(`📋 Total backups found: ${backups.length}`);

        } else {
            console.error('❌ Backup failed:', backupResult.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBackup();