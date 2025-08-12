const { backupEmailService } = require('./lib/backup-email-service.ts');
const { settingsService } = require('./lib/settings-service.ts');

async function testCompleteBackupEmailSystem() {
    console.log('🚀 تست کامل سیستم بک‌آپ و ارسال ایمیل');
    console.log('='.repeat(50));

    try {
        // 1. تست سیستم
        console.log('\n📋 1. تست وضعیت سیستم...');
        const systemTest = await backupEmailService.testBackupEmailSystem();

        console.log('   🔧 mysqldump:', systemTest.backup.available ? '✅ موجود' : '❌ موجود نیست');
        if (systemTest.backup.error) {
            console.log('      خطا:', systemTest.backup.error);
        }

        console.log('   📧 تنظیمات ایمیل:', systemTest.email.configured ? '✅ تنظیم شده' : '❌ تنظیم نشده');
        if (systemTest.email.error) {
            console.log('      خطا:', systemTest.email.error);
        }

        console.log('   🎯 وضعیت کلی:', systemTest.overall ? '✅ آماده' : '❌ نیاز به تنظیم');

        if (!systemTest.overall) {
            console.log('\n⚠️ سیستم آماده نیست. لطفاً ابتدا تنظیمات را کامل کنید.');
            return;
        }

        // 2. تنظیم ایمیل گیرنده (اگر نیاز باشد)
        console.log('\n📧 2. بررسی تنظیمات بک‌آپ...');
        const backupConfig = await settingsService.getBackupConfig();

        if (!backupConfig.emailRecipients || backupConfig.emailRecipients.length === 0) {
            console.log('   📝 تنظیم ایمیل پیش‌فرض...');

            const newConfig = {
                ...backupConfig,
                enabled: true,
                emailRecipients: ['only.link086@gmail.com'], // آدرس پیش‌فرض
                compression: true,
                retentionDays: 30
            };

            await settingsService.setBackupConfig(newConfig);
            console.log('   ✅ تنظیمات بک‌آپ به‌روزرسانی شد');
        } else {
            console.log(`   ✅ ${backupConfig.emailRecipients.length} گیرنده تعریف شده:`, backupConfig.emailRecipients);
        }

        // 3. آمار بک‌آپ‌های قبلی
        console.log('\n📊 3. آمار بک‌آپ‌های اخیر...');
        const stats = await backupEmailService.getBackupStats();
        console.log(`   📁 کل بک‌آپ‌ها: ${stats.totalBackups}`);
        console.log(`   ✅ موفق: ${stats.successfulBackups}`);
        console.log(`   ❌ ناموفق: ${stats.failedBackups}`);
        console.log(`   💾 حجم کل: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);

        if (stats.lastBackup) {
            console.log(`   🕐 آخرین بک‌آپ: ${stats.lastBackup.date.toLocaleString('fa-IR')} (${stats.lastBackup.status})`);
        }

        // 4. ایجاد بک‌آپ تست
        console.log('\n🔄 4. ایجاد بک‌آپ تست...');
        const backupResult = await backupEmailService.createBackupAndSendEmail({
            compress: true,
            includeData: true,
            sendEmail: true
        });

        if (backupResult.success) {
            console.log('   ✅ بک‌آپ با موفقیت ایجاد شد!');

            if (backupResult.backup) {
                console.log(`   📁 نام فایل: ${backupResult.backup.fileName}`);
                console.log(`   📊 حجم: ${(backupResult.backup.fileSize / 1024 / 1024).toFixed(2)} MB`);
                console.log(`   ⏱️ مدت زمان: ${Math.round(backupResult.backup.duration / 1000)} ثانیه`);
            }

            if (backupResult.email) {
                if (backupResult.email.sent) {
                    console.log(`   📧 ایمیل به ${backupResult.email.recipients.length} گیرنده ارسال شد`);
                    console.log(`   📮 گیرندگان: ${backupResult.email.recipients.join(', ')}`);
                } else {
                    console.log('   ⚠️ ایمیل ارسال نشد:', backupResult.email.error);
                }
            }
        } else {
            console.log('   ❌ بک‌آپ ناموفق بود:', backupResult.error);
        }

        // 5. تست ارسال سریع
        console.log('\n⚡ 5. تست ارسال سریع...');
        const quickResult = await backupEmailService.quickBackupAndEmail('only.link086@gmail.com');

        if (quickResult.success) {
            console.log('   ✅ بک‌آپ سریع موفق بود!');
        } else {
            console.log('   ❌ بک‌آپ سریع ناموفق:', quickResult.error);
        }

        console.log('\n🎉 تست کامل سیستم به پایان رسید!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ خطا در تست سیستم:', error.message);
    }
}

// اجرای تست
testCompleteBackupEmailSystem();