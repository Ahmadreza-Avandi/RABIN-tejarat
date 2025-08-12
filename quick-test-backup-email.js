#!/usr/bin/env node

/**
 * اسکریپت تست سریع سیستم بک‌آپ و ارسال ایمیل
 * 
 * استفاده:
 * node quick-test-backup-email.js [email]
 * 
 * مثال:
 * node quick-test-backup-email.js only.link086@gmail.com
 */

const { backupEmailService } = require('./lib/backup-email-service.ts');

async function quickTest() {
    const email = process.argv[2] || 'only.link086@gmail.com';

    console.log('🚀 تست سریع سیستم بک‌آپ و ایمیل');
    console.log(`📧 ایمیل گیرنده: ${email}`);
    console.log('-'.repeat(40));

    try {
        // 1. تست سیستم
        console.log('🔍 بررسی وضعیت سیستم...');
        const systemTest = await backupEmailService.testBackupEmailSystem();

        if (!systemTest.overall) {
            console.log('❌ سیستم آماده نیست:');
            if (!systemTest.backup.available) {
                console.log('   - mysqldump موجود نیست');
            }
            if (!systemTest.email.configured) {
                console.log('   - تنظیمات ایمیل کامل نیست');
            }
            return;
        }

        console.log('✅ سیستم آماده است');

        // 2. ایجاد و ارسال بک‌آپ
        console.log('\n🔄 ایجاد بک‌آپ و ارسال ایمیل...');
        const startTime = Date.now();

        const result = await backupEmailService.quickBackupAndEmail(email);

        const duration = Math.round((Date.now() - startTime) / 1000);

        if (result.success) {
            console.log('🎉 موفقیت!');
            console.log(`⏱️  مدت زمان کل: ${duration} ثانیه`);

            if (result.backup) {
                console.log(`📁 فایل: ${result.backup.fileName}`);
                console.log(`📊 حجم: ${(result.backup.fileSize / 1024 / 1024).toFixed(2)} MB`);
            }

            if (result.email && result.email.sent) {
                console.log(`📧 ایمیل ارسال شد به: ${result.email.recipients.join(', ')}`);
            } else if (result.email && !result.email.sent) {
                console.log(`⚠️  ایمیل ارسال نشد: ${result.email.error}`);
            }
        } else {
            console.log('❌ خطا:', result.error);
        }

    } catch (error) {
        console.error('💥 خطای غیرمنتظره:', error.message);
    }
}

// اجرای تست
if (require.main === module) {
    quickTest().then(() => {
        console.log('\n✨ تست تکمیل شد');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 خطا در اجرای تست:', error);
        process.exit(1);
    });
}

module.exports = { quickTest };