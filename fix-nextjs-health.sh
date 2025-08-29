#!/bin/bash

# Fix Next.js Health Check - حل مشکل health check
echo "🔧 حل مشکل Next.js Health Check..."

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
log_info "مرحله 1: بررسی وضعیت فعلی"

# بررسی کانتینر
if docker-compose -f docker-compose.production.yml ps | grep -q "nextjs.*Up"; then
    log_success "کانتینر Next.js در حال اجرا است"
else
    log_error "کانتینر Next.js در حال اجرا نیست"
fi

# تست health endpoint از داخل کانتینر
log_info "تست health endpoint از داخل کانتینر..."
INTERNAL_HEALTH=$(docker-compose -f docker-compose.production.yml exec -T nextjs curl -s http://localhost:3000/api/health 2>/dev/null || echo "failed")

if echo "$INTERNAL_HEALTH" | grep -q "ok\|status"; then
    log_success "Health endpoint از داخل کانتینر کار می‌کند"
else
    log_error "Health endpoint از داخل کانتینر کار نمی‌کند"
fi

# تست از خارج کانتینر
log_info "تست health endpoint از خارج کانتینر..."
EXTERNAL_HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "failed")

if echo "$EXTERNAL_HEALTH" | grep -q "ok\|status"; then
    log_success "Health endpoint از خارج کانتینر کار می‌کند"
else
    log_error "Health endpoint از خارج کانتینر کار نمی‌کند"
fi

echo ""
log_info "مرحله 2: اعمال تصحیحات"

# ری‌استارت Next.js
log_info "ری‌استارت کانتینر Next.js..."
docker-compose -f docker-compose.production.yml restart nextjs

# انتظار برای آماده شدن
log_info "انتظار 30 ثانیه برای آماده شدن..."
sleep 30

echo ""
log_info "مرحله 3: تست مجدد"

# تست مجدد
for i in {1..5}; do
    log_info "تست $i از 5..."
    
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        log_success "Health check موفق!"
        echo "📥 پاسخ: $HEALTH_RESPONSE"
        break
    else
        log_warning "تست $i ناموفق، انتظار 10 ثانیه..."
        sleep 10
    fi
    
    if [ $i -eq 5 ]; then
        log_error "تمام تست‌ها ناموفق"
    fi
done

echo ""
log_info "مرحله 4: تست API های صوتی"

# تست speech recognition
log_info "تست API تشخیص گفتار..."
SPEECH_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
    -d '{"data":"dGVzdA==","language":"fa","format":"pcm"}' 2>/dev/null)

if echo "$SPEECH_RESPONSE" | grep -q "success\|fallback\|unauthorized"; then
    log_success "API تشخیص گفتار پاسخ می‌دهد"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 100)..."
else
    log_warning "API تشخیص گفتار مشکل دارد"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 100)..."
fi

echo ""
log_info "مرحله 5: بررسی نهایی"

# وضعیت کانتینرها
log_info "وضعیت نهایی کانتینرها:"
docker-compose -f docker-compose.production.yml ps

# لاگ‌های اخیر
log_info "لاگ‌های اخیر Next.js:"
docker-compose -f docker-compose.production.yml logs --tail=5 nextjs

echo ""
log_success "تصحیحات اعمال شد!"
echo ""
echo "🎯 حالا تست کنید:"
echo "  • Health: curl http://localhost:3000/api/health"
echo "  • مرورگر: https://ahmadreza-avandi.ir/test-pcm-browser.html"
echo "  • سیستم صوتی: بگید 'گزارش احمد'"