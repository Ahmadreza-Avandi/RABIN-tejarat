#!/usr/bin/env node

/**
 * اسکریپت راه‌اندازی کامل سیستم بک‌آپ و ایمیل
 * 
 * این اسکریپت:
 * 1. جداول مورد نیاز را ایجاد می‌کند
 * 2. تنظیمات پیش‌فرض را وارد می‌کند
 * 3. سیستم را تست می‌کند
 * 4. راهنمای استفاده را نمایش می‌دهد
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BackupSystemSetup {
    constructor() {
        this.dbConfig = {
            host: process.env.DATABASE_HOST || 'localhost',
            user: 'root',
            password: '1234',
            database: 'crm_system'
        };
    }

    async run() {
        console.log('🚀 راه‌اندازی سیستم بک‌آپ و ارسال ایمیل');
        console.log('='.repeat(50));

        try {
            // 1. بررسی پیش‌نیازها
            await this.checkPrerequisites();

            // 2. ایجاد جداول دیتابیس
            await this.setupDatabase();

            // 3. ایجاد پوشه بک‌آپ
            await this.createBackupDirectory();

            // 4. تست سیستم
            await this.testSystem();

            // 5. نمایش راهنما
            this.showUsageGuide();

            console.log('\n🎉 راه‌اندازی با موفقیت تکمیل شد!');

        } catch (error) {
            console.error('❌ خطا در راه‌اندازی:', error.message);
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('\n📋 1. بررسی پیش‌نیازها...');

        // بررسی mysqldump
        try {
            const { stdout } = await execAsync('mysqldump --version');
            console.log('   ✅ mysqldump موجود است:', stdout.trim().split('\n')[0]);
        } catch (error) {
            throw new Error('mysqldump موجود نیست. لطفاً MySQL client را نصب کنید.');
        }

        // بررسی اتصال دیتابیس
        try {
            const testCmd = `mysql -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} -e "SELECT 1;" ${this.dbConfig.database}`;
            await execAsync(testCmd);
            console.log('   ✅ اتصال به دیتابیس موفق');
        } catch (error) {
            throw new Error('خطا در اتصال به دیتابیس. تنظیمات را بررسی کنید.');
        }

        // بررسی متغیرهای محیط
        const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.log('   ⚠️ متغیرهای محیط ناقص:', missingVars.join(', '));
            console.log('   💡 لطفاً فایل .env را تکمیل کنید');
        } else {
            console.log('   ✅ متغیرهای محیط تنظیم شده');
        }
    }

    async setupDatabase() {
        console.log('\n🗄️ 2. راه‌اندازی دیتابیس...');

        try {
            // خواندن فایل SQL
            const sqlFile = path.join(__dirname, 'database-backup-tables.sql');
            const sqlContent = await fs.readFile(sqlFile, 'utf8');

            // اجرای دستورات SQL
            const tempFile = path.join(__dirname, 'temp-setup.sql');
            await fs.writeFile(tempFile, sqlContent);

            const importCmd = `mysql -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} ${this.dbConfig.database} < "${tempFile}"`;
            await execAsync(importCmd);

            // حذف فایل موقت
            await fs.unlink(tempFile);

            console.log('   ✅ جداول و تنظیمات پیش‌فرض ایجاد شد');

        } catch (error) {
            throw new Error(`خطا در راه‌اندازی دیتابیس: ${error.message}`);
        }
    }

    async createBackupDirectory() {
        console.log('\n📁 3. ایجاد پوشه بک‌آپ...');

        const backupDir = path.join(process.cwd(), 'backups');

        try {
            await fs.access(backupDir);
            console.log('   ✅ پوشه backups موجود است');
        } catch {
            await fs.mkdir(backupDir, { recursive: true });
            console.log('   ✅ پوشه backups ایجاد شد');
        }

        // تنظیم مجوزها (در Linux/Mac)
        if (process.platform !== 'win32') {
            try {
                await execAsync(`chmod 755 "${backupDir}"`);
                console.log('   ✅ مجوزهای پوشه تنظیم شد');
            } catch (error) {
                console.log('   ⚠️ خطا در تنظیم مجوزها:', error.message);
            }
        }
    }

    async testSystem() {
        console.log('\n🧪 4. تست سیستم...');

        try {
            // تست ایجاد بک‌آپ ساده
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const testFileName = `test_setup_${timestamp}.sql`;
            const testFilePath = path.join(process.cwd(), 'backups', testFileName);

            const backupCmd = `mysqldump -h ${this.dbConfig.host} -u ${this.dbConfig.user} -p${this.dbConfig.password} --single-transaction --no-data ${this.dbConfig.database} > "${testFilePath}"`;

            await execAsync(backupCmd);

            // بررسی حجم فایل
            const stats = await fs.stat(testFilePath);
            const sizeKB = (stats.size / 1024).toFixed(2);

            console.log(`   ✅ بک‌آپ تست ایجاد شد: ${testFileName} (${sizeKB} KB)`);

            // حذف فایل تست
            await fs.unlink(testFilePath);
            console.log('   ✅ فایل تست پاک شد');

        } catch (error) {
            throw new Error(`خطا در تست سیستم: ${error.message}`);
        }
    }

    showUsageGuide() {
        console.log('\n📖 5. راهنمای استفاده:');
        console.log('-'.repeat(30));

        console.log('\n🔧 تست سیستم:');
        console.log('   node test-backup-email-complete.js');
        console.log('   node quick-test-backup-email.js your-email@gmail.com');

        console.log('\n🌐 استفاده از API:');
        console.log('   POST /api/backup/create - ایجاد بک‌آپ کامل');
        console.log('   POST /api/backup/quick-send - ارسال سریع');
        console.log('   GET /api/backup/create?action=stats - آمار بک‌آپ‌ها');

        console.log('\n⚙️ تنظیمات:');
        console.log('   - فایل .env را تکمیل کنید');
        console.log('   - Gmail App Password تنظیم کنید');
        console.log('   - آدرس‌های ایمیل گیرنده را در پنل تنظیمات اضافه کنید');

        console.log('\n📚 مستندات کامل:');
        console.log('   مطالعه فایل BACKUP_EMAIL_GUIDE.md');

        console.log('\n🔄 زمان‌بندی خودکار:');
        console.log('   crontab -e');
        console.log('   0 2 * * * cd /path/to/project && node quick-test-backup-email.js');
    }
}

// اجرای اسکریپت
if (require.main === module) {
    const setup = new BackupSystemSetup();
    setup.run().catch(error => {
        console.error('💥 خطای کلی:', error);
        process.exit(1);
    });
}

module.exports = BackupSystemSetup;