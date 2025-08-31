#!/bin/bash
echo "🔧 تست کامل سیستم صوتی VPS..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo ""
log_info "=== تست 1: وضعیت کانتینرها ==="
docker-compose -f docker-compose.production.yml ps

echo ""
log_info "=== تست 2: Health Check ==="
for i in {1..5}; do
    log_info "تست health check $i/5..."
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        log_success "Health check موفق!"
        echo "📥 پاسخ: $HEALTH_RESPONSE"
        break
    else
        if [ $i -eq 5 ]; then
            log_error "Health check ناموفق بعد از 5 تلاش"
            log_info "بررسی لاگ‌ها: docker-compose -f docker-compose.production.yml logs nextjs"
        else
            log_warning "تلاش $i ناموفق، انتظار 10 ثانیه..."
            sleep 10
        fi
    fi
done

echo ""
log_info "=== تست 3: اتصال شبکه ==="
# Test network connectivity to Sahab
log_info "تست اتصال به Sahab API..."
if curl -s --connect-timeout 5 --max-time 10 https://partai.gw.isahab.ir/speechRecognition/v1/base64 > /dev/null; then
    log_success "اتصال به Sahab برقرار است"
    SAHAB_AVAILABLE=true
else
    log_error "اتصال به Sahab برقرار نیست - fallback فعال"
    SAHAB_AVAILABLE=false
fi

# Test internet connection
if curl -s --connect-timeout 5 --max-time 10 https://www.google.com > /dev/null; then
    log_success "اتصال اینترنت موفق"
else
    log_error "اتصال اینترنت ناموفق"
fi

echo ""
log_info "=== تست 4: API های صوتی ==="

# Test speech recognition endpoint
log_info "تست API تشخیص گفتار..."
SPEECH_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
    -d '{"data":"dGVzdA==","language":"fa","format":"pcm","sampleRate":16000,"channels":1,"bitDepth":16}' 2>/dev/null)

if echo "$SPEECH_RESPONSE" | grep -q "success"; then
    log_success "API تشخیص گفتار موفق"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 150)..."
elif echo "$SPEECH_RESPONSE" | grep -q "fallback\|vps_mode"; then
    log_success "API تشخیص گفتار در حالت fallback کار می‌کند"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 150)..."
elif echo "$SPEECH_RESPONSE" | grep -q "unauthorized\|توکن"; then
    log_warning "API تشخیص گفتار نیاز به احراز هویت دارد (طبیعی است)"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 150)..."
else
    log_error "API تشخیص گفتار مشکل دارد"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 150)..."
fi

# Test TTS endpoint
log_info "تست API تبدیل متن به گفتار..."
TTS_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/voice-analysis/sahab-tts \
    -d '{"text":"سلام","voice":"female"}' 2>/dev/null)

if echo "$TTS_RESPONSE" | grep -q "success\|audio"; then
    log_success "API TTS موفق"
elif echo "$TTS_RESPONSE" | grep -q "fallback"; then
    log_success "API TTS در حالت fallback کار می‌کند"
elif echo "$TTS_RESPONSE" | grep -q "unauthorized"; then
    log_warning "API TTS نیاز به احراز هویت دارد (طبیعی است)"
else
    log_error "API TTS مشکل دارد"
fi

echo ""
log_info "=== تست 5: فایل‌های وب ==="

# Test PCM browser page
if curl -s http://localhost:3000/test-pcm-browser.html | grep -q "تست PCM"; then
    log_success "صفحه تست PCM در دسترس است"
else
    log_warning "صفحه تست PCM در دسترس نیست"
fi

echo ""
log_info "=== خلاصه نتایج ==="

if [ "$SAHAB_AVAILABLE" = true ]; then
    log_success "Sahab API در دسترس است"
else
    log_warning "Sahab API بلاک است - سیستم از fallback استفاده می‌کند"
fi

echo ""
echo "🎯 برای تست کامل سیستم صوتی:"
echo "  1. به https://ahmadreza-avandi.ir/test-pcm-browser.html بروید"
echo "  2. تست‌های مختلف را اجرا کنید"
echo "  3. بگویید: 'گزارش احمد'"
echo ""
echo "🔧 اگر مشکل دارید:"
echo "  • لاگ‌ها: docker-compose -f docker-compose.production.yml logs -f nextjs"
echo "  • دیباگ: ./debug-audio-production.sh"
echo "  • ری‌استارت: docker-compose -f docker-compose.production.yml restart nextjs"

log_success "تست سیستم صوتی تکمیل شد! 🎤"
