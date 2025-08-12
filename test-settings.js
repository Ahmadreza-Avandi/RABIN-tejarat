const { settingsService } = require('./lib/settings-service');

async function testSettings() {
    console.log('🔧 Testing settings service...\n');

    try {
        // 1. Test getting backup config
        console.log('1️⃣ Getting backup configuration...');
        const backupConfig = await settingsService.getBackupConfig();
        console.log('📋 Backup config:', JSON.stringify(backupConfig, null, 2));

        // 2. Test setting backup config
        console.log('\n2️⃣ Updating backup configuration...');
        const newBackupConfig = {
            ...backupConfig,
            enabled: true,
            emailRecipients: ['only.link086@gmail.com'],
            retentionDays: 15
        };

        const backupUpdateResult = await settingsService.setBackupConfig(newBackupConfig);
        console.log('✅ Backup config updated:', backupUpdateResult);

        // 3. Test getting email config
        console.log('\n3️⃣ Getting email configuration...');
        const emailConfig = await settingsService.getEmailConfig();
        console.log('📧 Email config:', {
            ...emailConfig,
            smtp_password: emailConfig.smtp_password ? '••••••••' : ''
        });

        // 4. Test validation
        console.log('\n4️⃣ Testing validation...');
        const validationResult = await settingsService.validateBackupConfig(newBackupConfig);
        console.log('✅ Backup config validation:', validationResult);

        // 5. Test system status
        console.log('\n5️⃣ Getting system status...');
        const systemStatus = await settingsService.getSystemStatus();
        console.log('📊 System status:', JSON.stringify(systemStatus, null, 2));

        // 6. Test getting all settings
        console.log('\n6️⃣ Getting all settings...');
        const allSettings = await settingsService.getAllSettings();
        console.log('⚙️ All settings keys:', Object.keys(allSettings));

        console.log('\n🎉 Settings test completed successfully!');

    } catch (error) {
        console.error('❌ Settings test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

testSettings();