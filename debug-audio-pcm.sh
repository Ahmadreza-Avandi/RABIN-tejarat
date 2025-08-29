#!/bin/bash

# Debug Audio PCM - تست و دیباگ سیستم صوتی با PCM
echo "🔧 شروع دیباگ سیستم صوتی PCM..."

# رنگ‌ها برای خروجی
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# تابع لاگ
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# بررسی وجود فایل‌های ضروری
log_info "بررسی فایل‌های ضروری..."

if [ ! -f "lib/pcm-audio-converter.ts" ]; then
    log_error "فایل PCM converter یافت نشد!"
    exit 1
fi

if [ ! -f "lib/advanced-speech-to-text.ts" ]; then
    log_error "فایل advanced speech-to-text یافت نشد!"
    exit 1
fi

if [ ! -f "app/api/voice-analysis/sahab-speech-recognition/route.ts" ]; then
    log_error "فایل API route یافت نشد!"
    exit 1
fi

log_success "تمام فایل‌های ضروری موجود هستند"

# بررسی متغیرهای محیطی
log_info "بررسی متغیرهای محیطی..."

if [ -f ".env.local" ]; then
    source .env.local
    log_success "فایل .env.local بارگذاری شد"
else
    log_warning "فایل .env.local یافت نشد"
fi

if [ -z "$SAHAB_API_KEY" ]; then
    log_warning "SAHAB_API_KEY تنظیم نشده"
else
    log_success "SAHAB_API_KEY موجود است"
fi

# تست اتصال به API
log_info "تست اتصال به Sahab API..."

SAHAB_URL="https://partai.gw.isahab.ir/speechRecognition/v1/base64"
SAHAB_TOKEN=${SAHAB_API_KEY:-"eyJhbGciOiJIUzI1NiJ9.eyJzeXN0ZW0iOiJzYWhhYiIsImNyZWF0ZVRpbWUiOiIxNDA0MDYwNjIzMjM1MDA3MCIsInVuaXF1ZUZpZWxkcyI6eyJ1c2VybmFtZSI6ImU2ZTE2ZWVkLTkzNzEtNGJlOC1hZTBiLTAwNGNkYjBmMTdiOSJ9LCJncm91cE5hbWUiOiIxMmRhZWM4OWE4M2EzZWU2NWYxZjMzNTFlMTE4MGViYiIsImRhdGEiOnsic2VydmljZUlEIjoiOWYyMTU2NWMtNzFmYS00NWIzLWFkNDAtMzhmZjZhNmM1YzY4IiwicmFuZG9tVGV4dCI6Ik9WVVZyIn19.sEUI-qkb9bT9eidyrj1IWB5Kwzd8A2niYrBwe1QYfpY"}

# تست ping به سرور
if ping -c 1 partai.gw.isahab.ir &> /dev/null; then
    log_success "اتصال شبکه به Sahab برقرار است"
else
    log_error "اتصال شبکه به Sahab برقرار نیست"
fi

# تست HTTP به API
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "gateway-token: $SAHAB_TOKEN" \
    -X POST \
    --connect-timeout 10 \
    --max-time 30 \
    "$SAHAB_URL" \
    -d '{"language":"fa","data":"test"}' 2>/dev/null)

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "400" ]; then
    log_success "Sahab API در دسترس است (HTTP: $HTTP_STATUS)"
elif [ "$HTTP_STATUS" = "000" ]; then
    log_error "خطای اتصال به Sahab API (timeout یا network error)"
else
    log_warning "Sahab API پاسخ غیرمنتظره داد (HTTP: $HTTP_STATUS)"
fi

# تست local API
log_info "تست local API..."

if command -v curl &> /dev/null; then
    # بررسی اینکه سرور Next.js در حال اجرا است
    if curl -s http://localhost:3000/api/health &> /dev/null; then
        log_success "سرور Next.js در حال اجرا است"
        
        # تست API endpoint
        LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Content-Type: application/json" \
            -X GET \
            http://localhost:3000/api/voice-analysis/sahab-speech-recognition 2>/dev/null)
        
        if [ "$LOCAL_STATUS" = "401" ]; then
            log_success "API endpoint در دسترس است (نیاز به احراز هویت)"
        elif [ "$LOCAL_STATUS" = "200" ]; then
            log_success "API endpoint در دسترس است"
        else
            log_warning "API endpoint پاسخ غیرمنتظره داد (HTTP: $LOCAL_STATUS)"
        fi
    else
        log_warning "سرور Next.js در حال اجرا نیست"
        log_info "برای شروع سرور: npm run dev"
    fi
else
    log_warning "curl در دسترس نیست"
fi

# بررسی وابستگی‌های Node.js
log_info "بررسی وابستگی‌های Node.js..."

if [ -f "package.json" ]; then
    if command -v npm &> /dev/null; then
        # بررسی وابستگی‌های مهم
        if npm list next &> /dev/null; then
            log_success "Next.js نصب شده"
        else
            log_warning "Next.js نصب نشده یا مشکل دارد"
        fi
        
        if npm list typescript &> /dev/null; then
            log_success "TypeScript نصب شده"
        else
            log_warning "TypeScript نصب نشده"
        fi
    else
        log_warning "npm در دسترس نیست"
    fi
else
    log_error "فایل package.json یافت نشد"
fi

# تولید فایل تست PCM
log_info "تولید فایل تست PCM..."

cat > test-pcm-conversion.js << 'EOF'
// تست تبدیل PCM
const fs = require('fs');

// تولید یک فایل WAV ساده برای تست
function generateTestWav() {
    const sampleRate = 16000;
    const duration = 1; // 1 second
    const samples = sampleRate * duration;
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
    buffer.writeUInt32LE(16, offset); offset += 4; // PCM format size
    buffer.writeUInt16LE(1, offset); offset += 2; // PCM format
    buffer.writeUInt16LE(channels, offset); offset += 2;
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(sampleRate * blockAlign, offset); offset += 4;
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(bitDepth, offset); offset += 2;
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;
    
    // Generate sine wave data (440Hz)
    for (let i = 0; i < samples; i++) {
        const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
        const pcmSample = Math.round(sample * 32767);
        buffer.writeInt16LE(pcmSample, offset);
        offset += 2;
    }
    
    return buffer;
}

// تولید فایل تست
const testWav = generateTestWav();
fs.writeFileSync('test-audio.wav', testWav);

console.log('✅ فایل test-audio.wav تولید شد');
console.log('📊 مشخصات: 16kHz, 1 channel, 16-bit PCM, 1 second, 440Hz sine wave');
console.log('📁 حجم فایل:', testWav.length, 'bytes');

// تبدیل به base64 برای تست API
const base64Data = testWav.toString('base64');
console.log('📝 طول base64:', base64Data.length);

// ذخیره base64 برای تست
fs.writeFileSync('test-audio-base64.txt', base64Data);
console.log('✅ فایل test-audio-base64.txt تولید شد');
EOF

if command -v node &> /dev/null; then
    node test-pcm-conversion.js
    if [ -f "test-audio.wav" ]; then
        log_success "فایل تست PCM تولید شد"
        log_info "فایل‌های تولید شده:"
        log_info "  - test-audio.wav (فایل صوتی)"
        log_info "  - test-audio-base64.txt (base64 برای API)"
    else
        log_error "خطا در تولید فایل تست"
    fi
else
    log_warning "Node.js در دسترس نیست، فایل تست تولید نشد"
fi

# تست API با فایل تولید شده
if [ -f "test-audio-base64.txt" ] && [ -f ".env.local" ]; then
    log_info "تست API با فایل تولید شده..."
    
    BASE64_DATA=$(cat test-audio-base64.txt)
    
    # تست با curl
    if command -v curl &> /dev/null; then
        RESPONSE=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -H "gateway-token: $SAHAB_TOKEN" \
            --connect-timeout 10 \
            --max-time 60 \
            "$SAHAB_URL" \
            -d "{\"language\":\"fa\",\"data\":\"$BASE64_DATA\"}" 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            log_success "درخواست API ارسال شد"
            echo "📥 پاسخ API:"
            echo "$RESPONSE" | head -c 500
            echo ""
        else
            log_error "خطا در ارسال درخواست API"
        fi
    fi
fi

# پاک‌سازی فایل‌های موقت
log_info "پاک‌سازی فایل‌های موقت..."
rm -f test-pcm-conversion.js test-audio.wav test-audio-base64.txt

# خلاصه نتایج
echo ""
log_info "=== خلاصه دیباگ ==="
log_info "1. فایل‌های PCM converter و API موجود هستند"
log_info "2. برای تست کامل، سرور را اجرا کنید: npm run dev"
log_info "3. برای تست دستی از فایل‌های debug استفاده کنید"
log_info "4. لاگ‌های مفصل در کنسول مرورگر قابل مشاهده است"

echo ""
log_success "دیباگ PCM تکمیل شد!"