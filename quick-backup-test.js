const { backupService } = require('./lib/backup');
const { emailService } = require('./lib/email-service');

async function quickTest() {
    console.log('🚀 Quick backup test starting...\n');

    try {
        // Test backup creation
        console.log('Creating backup...');
        const result = await backupService.createBackup({
            compress: true,
            includeData: true
        });

        if (result.success) {
            console.log('✅ Backup created:', result.fileName);
            console.log(`📊 Size: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);

            // Send email
            console.log('\nSending email...');
            const emailResult = await emailService.sendBackupEmail(
                result,
                'only.link086@gmail.com'
            );

            if (emailResult.success) {
                console.log('✅ Email sent successfully!');
            } else {
                console.log('❌ Email failed:', emailResult.error);
            }
        } else {
            console.log('❌ Backup failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

quickTest();