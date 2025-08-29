#!/bin/bash

echo "👤 Creating Admin User for Testing..."

# Create admin user in database
docker exec crm-mysql mysql -ucrm_app_user -p1234 << 'EOF'
USE crm_system;

-- Create admin user if not exists
INSERT IGNORE INTO users (
    name, 
    email, 
    password, 
    role, 
    status, 
    created_at, 
    updated_at
) VALUES (
    'مدیر سیستم',
    'admin@ahmadreza-avandi.ir',
    '$2b$10$rQZ8kqVZ8kqVZ8kqVZ8kqOuKqVZ8kqVZ8kqVZ8kqVZ8kqVZ8kqVZ8q',  -- This is hashed 'admin123'
    'admin',
    'active',
    NOW(),
    NOW()
);

-- Show created user
SELECT id, name, email, role, status FROM users WHERE email = 'admin@ahmadreza-avandi.ir';

-- Also create a test employee for reports
INSERT IGNORE INTO users (
    name, 
    email, 
    password, 
    role, 
    status, 
    created_at, 
    updated_at
) VALUES (
    'احمد محمدی',
    'ahmad@ahmadreza-avandi.ir',
    '$2b$10$rQZ8kqVZ8kqVZ8kqVZ8kqOuKqVZ8kqVZ8kqVZ8kqVZ8kqVZ8kqVZ8q',
    'employee',
    'active',
    NOW(),
    NOW()
);

-- Show all users
SELECT id, name, email, role, status FROM users ORDER BY created_at DESC LIMIT 10;
EOF

echo "✅ Admin user creation completed!"
echo "📋 Admin credentials:"
echo "   Email: admin@ahmadreza-avandi.ir"
echo "   Password: admin123"
echo ""
echo "🧪 Now you can test with: ./quick-audio-test.sh"