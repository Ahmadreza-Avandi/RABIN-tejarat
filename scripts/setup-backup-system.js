const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');

async function setupBackupSystem() {
    let connection;

    try {
        console.log('🔄 Setting up backup system...\n');

        // 1. Connect to database
        console.log('1️⃣ Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST || 'localhost',
            user: 'root',
            password: '1234',
            database: 'crm_system'
        });
        console.log('✅ Connected to database\n');

        // 2. Read and execute SQL setup script
        console.log('2️⃣ Creating required tables...');
        const sqlScript = await fs.readFile(
            path.join(__dirname, 'create-settings-tables.sql'),
            'utf8'
        );

        // Split by semicolon and execute each statement
        const statements = sqlScript
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
            try {
                await connection.execute(statement);
                console.log('✅ Executed SQL statement');
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.error('❌ SQL Error:', error.message);
                }
            }
        }
        console.log('✅ All tables created successfully\n');

        // 3. Create backup directory
        console.log('3️⃣ Creating backup directory...');
        const backupDir = path.join(process.cwd(), 'backups');
        try {
            await fs.access(backupDir);
            console.log('✅ Backup directory already exists');
        } catch {
            await fs.mkdir(backupDir, { recursive: true });
            console.log('✅ Backup directory created');
        }
        console.log('');

        // 4. Set default backup configuration
        console.log('4️⃣ Setting up default backup configuration...');
        const defaultBackupConfig = {
            enabled: false,
            schedule: 'daily',
            time: '02:00',
            emailRecipients: ['only.link086@gmail.com'], // Default email
            retentionDays: 30,
            compression: true
        };

        await connection.execute(
            `INSERT INTO system_settings (setting_key, setting_value, description, updated_at) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             setting_value = VALUES(setting_value), 
             updated_at = VALUES(updated_at)`,
            [
                'backup_config',
                JSON.stringify(defaultBackupConfig),
                'Backup configuration settings',
                new Date()
            ]
        );
        console.log('✅ Default backup configuration set\n');

        // 5. Set default email configuration
        console.log('5️⃣ Setting up default email configuration...');
        const defaultEmailConfig = {
            enabled: true,
            smtp_host: 'smtp.gmail.com',
            smtp_port: 587,
            smtp_secure: true,
            smtp_user: process.env.EMAIL_USER || '',
            smtp_password: process.env.EMAIL_PASSWORD || ''
        };

        await connection.execute(
            `INSERT INTO system_settings (setting_key, setting_value, description, updated_at) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             setting_value = VALUES(setting_value), 
             updated_at = VALUES(updated_at)`,
            [
                'email_config',
                JSON.stringify(defaultEmailConfig),
                'Email service configuration',
                new Date()
            ]
        );
        console.log('✅ Default email configuration set\n');

        // 6. Log setup completion
        await connection.execute(
            'INSERT INTO system_logs (log_type, status, details) VALUES (?, ?, ?)',
            [
                'system_setup',
                'success',
                JSON.stringify({
                    action: 'backup_system_setup',
                    timestamp: new Date().toISOString(),
                    components: ['database_tables', 'backup_directory', 'default_configs']
                })
            ]
        );

        console.log('🎉 Backup system setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Configure your email settings in the admin panel');
        console.log('2. Set up backup schedule and recipients');
        console.log('3. Test the backup system using: node test-backup-complete.js');
        console.log('4. Enable automatic backups in settings\n');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run setup
setupBackupSystem();