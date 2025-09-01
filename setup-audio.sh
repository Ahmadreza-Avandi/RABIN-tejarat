#!/bin/bash

echo "🎤 نصب و راه‌اندازی سیستم صوتی..."

# نصب پیش‌نیازها
apt-get update
apt-get install -y \
    pulseaudio \
    alsa-utils \
    ffmpeg \
    sox \
    libasound2-plugins

# تنظیم PulseAudio
cat > /etc/pulse/system.pa << EOL
#!/usr/bin/pulseaudio -nF
load-module module-native-protocol-unix
load-module module-native-protocol-tcp auth-anonymous=1
load-module module-always-sink
load-module module-null-sink sink_name=dummy
load-module module-null-sink sink_name=VPS_Audio
load-module module-virtual-sink sink_name=virtual_speaker
EOL

# راه‌اندازی PulseAudio به صورت سیستمی
pulseaudio --system --daemonize

# تست سیستم صوتی
echo "🔊 تست سیستم صوتی..."
aplay -l
pactl list sinks

echo "✅ نصب سیستم صوتی کامل شد!"
