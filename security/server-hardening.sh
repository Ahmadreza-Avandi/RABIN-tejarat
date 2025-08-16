#!/bin/bash

# ===========================================
# 🔒 Server Security Hardening Script
# ===========================================

echo "🔒 Starting server security hardening..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install security tools
echo "🛡️ Installing security tools..."
sudo apt install -y fail2ban ufw htop iotop

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Configure fail2ban
echo "🚫 Configuring fail2ban..."
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Add custom fail2ban rules for nginx
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 5
EOF

# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Secure SSH (if needed)
echo "🔐 Securing SSH..."
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Set up log rotation
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-compose << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF

# Create monitoring script
echo "📊 Creating monitoring script..."
sudo tee /usr/local/bin/security-monitor.sh << 'EOF'
#!/bin/bash
echo "=== Security Status Report $(date) ==="
echo "🔥 Firewall Status:"
sudo ufw status
echo ""
echo "🚫 Fail2ban Status:"
sudo fail2ban-client status
echo ""
echo "🐳 Docker Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "💾 Disk Usage:"
df -h
echo ""
echo "🧠 Memory Usage:"
free -h
echo ""
echo "📊 Top Processes:"
ps aux --sort=-%cpu | head -10
EOF

sudo chmod +x /usr/local/bin/security-monitor.sh

# Create daily security check cron job
echo "⏰ Setting up daily security checks..."
(crontab -l 2>/dev/null; echo "0 6 * * * /usr/local/bin/security-monitor.sh >> /var/log/security-monitor.log 2>&1") | crontab -

echo "✅ Server hardening completed!"
echo ""
echo "🔒 Security measures applied:"
echo "   ✅ Firewall configured (only SSH, HTTP, HTTPS allowed)"
echo "   ✅ Fail2ban installed and configured"
echo "   ✅ SSH hardened (no root login, no password auth)"
echo "   ✅ Log rotation configured"
echo "   ✅ Daily security monitoring set up"
echo ""
echo "📋 Next steps:"
echo "   1. Reboot the server: sudo reboot"
echo "   2. Check security status: /usr/local/bin/security-monitor.sh"
echo "   3. Monitor logs: tail -f /var/log/security-monitor.log"