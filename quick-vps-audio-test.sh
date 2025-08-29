#!/bin/bash

# Quick VPS Audio Test - تست سریع سیستم صوتی VPS
echo "🚀 تست سریع سیستم صوتی VPS..."

# رنگ‌ها
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
if command -v docker-compose &> /dev/null; then
    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml ps
        
        # بررسی وضعیت Next.js
        if docker-compose -f docker-compose.production.yml ps | grep -q "nextjs.*Up"; then
            log_success "کانتینر Next.js در حال اجرا است"
        else
            log_error "کانتینر Next.js در حال اجرا نیست"
        fi
    else
        log_warning "فایل docker-compose.production.yml یافت نشد"
    fi
else
    log_error "Docker Compose نصب نیست"
fi

echo ""
log_info "=== تست 2: اتصال شبکه ==="

# تست اتصال به Sahab از host
log_info "تست اتصال به Sahab از host..."
if curl -s --connect-timeout 5 --max-time 10 https://partai.gw.isahab.ir/speechRecognition/v1/base64 > /dev/null 2>&1; then
    log_success "اتصال به Sahab از host موفق"
else
    log_error "اتصال به Sahab از host ناموفق"
fi

# تست اتصال به Google (برای بررسی اینترنت)
if curl -s --connect-timeout 5 --max-time 10 https://www.google.com > /dev/null 2>&1; then
    log_success "اتصال اینترنت موفق"
else
    log_error "اتصال اینترنت ناموفق"
fi

echo ""
log_info "=== تست 3: API محلی ==="

# تست health endpoint
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    log_success "Health endpoint پاسخ می‌دهد"
else
    log_error "Health endpoint پاسخ نمی‌دهد"
fi

# تست speech recognition endpoint
log_info "تست endpoint تشخیص گفتار..."
RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
    -d '{"data":"dGVzdA==","language":"fa","format":"pcm"}' 2>/dev/null)

if echo "$RESPONSE" | grep -q "success\|fallback\|vps_mode"; then
    log_success "API تشخیص گفتار پاسخ می‌دهد"
    echo "📥 پاسخ: $(echo "$RESPONSE" | head -c 100)..."
else
    log_warning "API تشخیص گفتار نیاز به احراز هویت دارد یا مشکل دارد"
    echo "📥 پاسخ: $(echo "$RESPONSE" | head -c 100)..."
fi

echo ""
log_info "=== تست 4: فایل‌های ضروری ==="

# بررسی فایل‌های PCM
FILES_TO_CHECK=(
    "lib/pcm-audio-converter.ts"
    "lib/advanced-speech-to-text.ts"
    "test-pcm-browser.html"
    "debug-audio-production.sh"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        log_success "فایل موجود: $file"
    else
        log_error "فایل مفقود: $file"
    fi
done

echo ""
log_info "=== تست 5: متغیرهای محیطی ==="

if [ -f ".env" ]; then
    log_success "فایل .env موجود است"
    
    # بررسی متغیرهای مهم
    if grep -q "SAHAB_API_KEY" .env; then
        log_success "SAHAB_API_KEY تنظیم شده"
    else
        log_warning "SAHAB_API_KEY تنظیم نشده"
    fi
    
    if grep -q "VPS_MODE" .env; then
        log_success "VPS_MODE تنظیم شده"
    else
        log_warning "VPS_MODE تنظیم نشده"
    fi
else
    log_error "فایل .env یافت نشد"
fi

echo ""
log_info "=== تست 6: لاگ‌های اخیر ==="

if [ -f "docker-compose.production.yml" ] && command -v docker-compose &> /dev/null; then
    log_info "آخرین لاگ‌های Next.js:"
    docker-compose -f docker-compose.production.yml logs --tail=10 nextjs 2>/dev/null | grep -E "(error|warning|audio|speech|sahab)" || echo "هیچ لاگ خاصی یافت نشد"
fi

echo ""
log_info "=== خلاصه و پیشنهادات ==="

echo "🎯 برای تست کامل سیستم صوتی:"
echo "  1. به https://your-domain.com/test-pcm-browser.html بروید"
echo "  2. تست‌های مختلف را اجرا کنید"
echo "  3. از HTTPS استفاده کنید (برای میکروفون)"

echo ""
echo "🔧 اگر مشکل دارید:"
echo "  • دیباگ کامل: ./debug-audio-production.sh"
echo "  • مشاهده لاگ: docker-compose -f docker-compose.production.yml logs -f nextjs"
echo "  • ری‌استارت: docker-compose -f docker-compose.production.yml restart nextjs"

echo ""
echo "📝 نکات مهم:"
echo "  • Sahab API ممکن است از VPS بلاک باشد (fallback فعال است)"
echo "  • PCM conversion در مرورگر کار می‌کند"
echo "  • سیستم برای VPS بهینه‌سازی شده"

echo ""
log_success "تست سریع تکمیل شد! 🚀"