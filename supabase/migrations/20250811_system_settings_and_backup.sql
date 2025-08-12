-- Create system_settings table for storing configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create backup_history table for tracking backups
CREATE TABLE IF NOT EXISTS backup_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('manual', 'automatic')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
    file_path TEXT,
    file_size BIGINT,
    error_message TEXT,
    email_recipient TEXT,
    initiated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create system_logs table for system activity logging
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);
CREATE INDEX IF NOT EXISTS idx_backup_history_type ON backup_history(type);
CREATE INDEX IF NOT EXISTS idx_backup_history_created_at ON backup_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON system_logs(type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('backup_config', '{
    "enabled": false,
    "schedule": "daily",
    "time": "02:00",
    "emailRecipients": [],
    "retentionDays": 30,
    "compression": true
}', 'Backup configuration settings'),
('email_config', '{
    "enabled": true,
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_secure": true,
    "smtp_user": "",
    "smtp_password": ""
}', 'Email service configuration'),
('system_monitoring', '{
    "enabled": true,
    "checkInterval": 300,
    "alertThresholds": {
        "diskSpace": 85,
        "memory": 90,
        "cpu": 80
    }
}', 'System monitoring configuration')
ON CONFLICT (key) DO NOTHING;

-- Create RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy for system_settings (admin only)
CREATE POLICY "Admin can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy for backup_history (admin only)
CREATE POLICY "Admin can manage backup history" ON backup_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy for system_logs (admin only)
CREATE POLICY "Admin can view system logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for system_settings
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old backup records
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
BEGIN
    -- Delete backup records older than retention period
    DELETE FROM backup_history 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND status = 'completed';
    
    -- Delete failed backup records older than 30 days
    DELETE FROM backup_history 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND status = 'failed';
END;
$$ LANGUAGE plpgsql;

-- Function to get system status summary
CREATE OR REPLACE FUNCTION get_system_status()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'database', json_build_object(
            'status', 'connected',
            'size', pg_size_pretty(pg_database_size(current_database())),
            'connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')
        ),
        'backups', json_build_object(
            'total', (SELECT count(*) FROM backup_history),
            'successful', (SELECT count(*) FROM backup_history WHERE status = 'completed'),
            'failed', (SELECT count(*) FROM backup_history WHERE status = 'failed'),
            'lastBackup', (SELECT created_at FROM backup_history WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1)
        ),
        'logs', json_build_object(
            'total', (SELECT count(*) FROM system_logs),
            'errors', (SELECT count(*) FROM system_logs WHERE status = 'failed'),
            'lastActivity', (SELECT created_at FROM system_logs ORDER BY created_at DESC LIMIT 1)
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;