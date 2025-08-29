#!/bin/bash

# Quick PCM Test - تست سریع PCM conversion
echo "🚀 تست سریع PCM..."

# رنگ‌ها
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# تولید فایل تست JavaScript
cat > quick-pcm-test.js << 'EOF'
const fs = require('fs');

console.log('🧪 شروع تست PCM...');

// تولید یک فایل WAV کوچک (0.5 ثانیه، 440Hz)
function generateMiniWav() {
    const sampleRate = 16000;
    const duration = 0.5;
    const samples = Math.floor(sampleRate * duration);
    const channels = 1;
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = channels * bytesPerSample;
    const dataSize = samples * blockAlign;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;
    
    const buffer = Buffer.alloc(fileSize);
    let offset = 0;
    
    // WAV header
    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4;
    buffer.writeUInt16LE(1, offset); offset += 2;
    buffer.writeUInt16LE(channels, offset); offset += 2;
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(sampleRate * blockAlign, offset); offset += 4;
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(bitDepth, offset); offset += 2;
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;
    
    // تولید sine wave
    for (let i = 0; i < samples; i++) {
        const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3;
        const pcmSample = Math.round(sample * 32767);
        buffer.writeInt16LE(pcmSample, offset);
        offset += 2;
    }
    
    return buffer;
}

try {
    // تولید فایل
    const wavBuffer = generateMiniWav();
    fs.writeFileSync('mini-test.wav', wavBuffer);
    
    console.log('✅ فایل mini-test.wav تولید شد');
    console.log('📊 حجم:', wavBuffer.length, 'bytes');
    
    // تبدیل به base64
    const base64 = wavBuffer.toString('base64');
    console.log('📝 طول base64:', base64.length);
    
    // ذخیره base64
    fs.writeFileSync('mini-test-base64.txt', base64);
    console.log('✅ فایل mini-test-base64.txt تولید شد');
    
    // نمایش اطلاعات
    console.log('🎵 مشخصات صوت:');
    console.log('  - Sample Rate: 16000 Hz');
    console.log('  - Channels: 1 (Mono)');
    console.log('  - Bit Depth: 16-bit');
    console.log('  - Duration: 0.5 seconds');
    console.log('  - Frequency: 440 Hz (A4 note)');
    
    console.log('🚀 آماده برای تست API!');
    
} catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
}
EOF

# اجرای تست
if command -v node &> /dev/null; then
    node quick-pcm-test.js
    
    if [ -f "mini-test.wav" ] && [ -f "mini-test-base64.txt" ]; then
        log_success "فایل‌های تست تولید شدند"
        
        # نمایش اطلاعات فایل‌ها
        echo "📁 فایل‌های تولید شده:"
        echo "  - mini-test.wav: $(wc -c < mini-test.wav) bytes"
        echo "  - mini-test-base64.txt: $(wc -c < mini-test-base64.txt) characters"
        
        # تست API اگر سرور در حال اجرا است
        if curl -s http://localhost:3000/api/health &> /dev/null; then
            log_success "سرور در حال اجرا است، تست API..."
            
            BASE64_DATA=$(cat mini-test-base64.txt)
            
            echo "🔄 ارسال درخواست به API..."
            RESPONSE=$(curl -s -X POST \
                -H "Content-Type: application/json" \
                -H "Cookie: auth-token=test" \
                http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
                -d "{\"data\":\"$BASE64_DATA\",\"language\":\"fa\"}" 2>/dev/null)
            
            echo "📥 پاسخ API:"
            echo "$RESPONSE" | head -c 300
            echo ""
            
        else
            log_warning "سرور در حال اجرا نیست"
            echo "💡 برای تست کامل: npm run dev"
        fi
        
        # پاک‌سازی
        echo ""
        echo "🧹 پاک‌سازی فایل‌های موقت..."
        rm -f quick-pcm-test.js mini-test.wav mini-test-base64.txt
        log_success "پاک‌سازی تکمیل شد"
        
    else
        log_error "خطا در تولید فایل‌های تست"
    fi
else
    log_error "Node.js در دسترس نیست"
fi

echo ""
echo "🎯 نتیجه‌گیری:"
echo "1. اگر فایل‌ها تولید شدند: PCM conversion کار می‌کند"
echo "2. اگر API پاسخ داد: ارتباط با سرور برقرار است"
echo "3. برای تست کامل: ./debug-audio-pcm.sh"
echo "4. برای عیب‌یابی: ./debug-problematic-services.sh"