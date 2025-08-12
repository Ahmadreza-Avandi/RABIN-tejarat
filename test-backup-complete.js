const { backupService } = require('./lib/backup');
const { emailService } = require('./lib/email-service');
const { settingsService } = require('./lib/settings-service');

async function testCompleteBackupSystem() {
    try {
        console.log('🔄 Testing complete backup system...\n');

        // 1. Test mysqldump availability
        console.log('1️⃣ Testing mysqldump availability...');
        const mysqldumpTest = await backupService.testMysqldump();
        console.log('📋 mysqldump test:', mysqldumpTest);

        if (!mysqldumpTest.available) {
            console.error('❌ mysqldump not available. Please install MySQL client tools.');
            return;
        }
        console.log('✅ mysqldump is available\n');

        // 2. Test email service
        console.log('2️⃣ Testing email service...');
        const emailInitialized = await emailService.initialize();
        if (emailInitialized) {
            console.log('✅ Email service initialized successfully');

            // Test sending a test email
            const testEmailResult = await emailService.sendTestEmail('only.link086@gmail.com');
            if (testEmailResult.success) {
                console.log('✅ Test email sent successfully');
            } else {
                console.log('⚠️ Test email failed:', testEmailResult.error);
            }
        } else {
            console.log('⚠️ Email service not initialized (check configuration)');
        }
        console.log('');

        // 3. Get current backup configuration
        console.log('3️⃣ Checking backup configuration...');
        const backupConfig = await settingsService.getBackupConfig();
        console.log('📋 Current backup config:', JSON.stringify(backupConfig, null, 2));
        console.log('');

        // 4. Create a test backup
        console.log('4️⃣ Creating test backup...');
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
            console.log(`📍 Path: ${backupResult.filePath}`);

            // 5. Send backup email if email service is working
            if (emailInitialized) {
                console.log('\n5️⃣ Sending backup notification email...');
                const emailResult = await emailService.sendBackupEmail(
                    backupResult,
                    'only.link086@gmail.com'
                );

                if (emailResult.success) {
                    console.log('✅ Backup notification email sent successfully');
                } else {
                    console.log('❌ Failed to send backup email:', emailResult.error);
                }
            }

            // 6. List all backups
            console.log('\n6️⃣ Listing all backups...');
            const backups = await backupService.listBackups();
            console.log(`📋 Total backups found: ${backups.length}`);

            if (backups.length > 0) {
                console.log('Recent backups:');
                backups.slice(0, 3).forEach((backup, index) => {
                    console.log(`  ${index + 1}. ${backup.fileName} (${backup.sizeFormatted}) - ${backup.createdAt.toLocaleString('fa-IR')}`);
                });
            }

            // 7. Test system status
            console.log('\n7️⃣ Getting system status...');
            const systemStatus = await settingsService.getSystemStatus();
            console.log('📊 System status:', JSON.stringify(systemStatus, null, 2));

        } else {
            console.error('❌ Backup failed:', backupResult.error);
        }

        console.log('\n🎉 Complete backup system test finished!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testCompleteBackupSystem();