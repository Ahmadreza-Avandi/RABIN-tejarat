const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs/promises');
const path = require('path');

const execAsync = promisify(exec);

async function testSimpleBackup() {
    try {
        console.log('🔄 Testing simple backup...');

        // Test mysqldump
        const { stdout } = await execAsync('mysqldump --version');
        console.log('✅ mysqldump available:', stdout.trim());

        // Create backup directory
        const backupDir = path.join(process.cwd(), 'backups');
        try {
            await fs.access(backupDir);
        } catch {
            await fs.mkdir(backupDir, { recursive: true });
            console.log('📁 Created backup directory');
        }

        // Create a simple backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `test_backup_${timestamp}.sql`;
        const filePath = path.join(backupDir, fileName);

        const backupCmd = `mysqldump -h localhost -u root -p1234 --single-transaction --routines --triggers crm_system > "${filePath}"`;

        console.log('🔄 Running backup command...');
        await execAsync(backupCmd);

        // Check file size
        const stats = await fs.stat(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log('✅ Backup completed successfully!');
        console.log(`📁 File: ${fileName}`);
        console.log(`📊 Size: ${sizeMB} MB`);
        console.log(`📍 Path: ${filePath}`);

        // List all backup files
        const files = await fs.readdir(backupDir);
        const backupFiles = files.filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'));
        console.log(`📋 Total backup files: ${backupFiles.length}`);

    } catch (error) {
        console.error('❌ Backup test failed:', error.message);
    }
}

testSimpleBackup();