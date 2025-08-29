#!/bin/bash

# ===========================================
# 🚀 Quick Audio System Test & Fix
# ===========================================

echo "🚀 تست سریع و تعمیر سیستم صوتی..."

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

# Step 1: Quick environment check
log_info "بررسی سریع محیط..."

if [ ! -f ".env.local" ]; then
    if [ -f ".env.server" ]; then
        cp .env.server .env.local
        log_success "فایل .env.local ایجاد شد"
    else
        log_error "فایل .env.server یافت نشد!"
        exit 1
    fi
fi

# Step 2: Check containers
log_info "بررسی کانتینرها..."

if ! docker ps | grep -q "crm-nextjs"; then
    log_warning "کانتینر NextJS در حال اجرا نیست"
    log_info "راه‌اندازی..."
    
    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml up -d
    else
        docker-compose up -d
    fi
    
    sleep 20
fi

# Step 3: Quick health test
log_info "تست سلامت سیستم..."

for i in {1..3}; do
    HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    
    if echo "$HEALTH" | grep -q '"status":"ok"'; then
        log_success "سیستم سالم است"
        
        # Show VPS mode status
        if echo "$HEALTH" | grep -q '"vps_mode":true'; then
            log_info "حالت VPS فعال است"
        fi
        
        # Show audio status
        if echo "$HEALTH" | grep -q '"fallback"'; then
            log_info "سیستم صوتی در حالت fallback"
        fi
        
        break
    else
        if [ $i -eq 3 ]; then
            log_error "سیستم پاسخ نمی‌دهد"
            log_info "بررسی لاگ‌ها:"
            docker logs crm-nextjs --tail=10
            exit 1
        else
            log_warning "تلاش $i/3 - انتظار..."
            sleep 10
        fi
    fi
done

# Step 4: Quick audio API test
log_info "تست سریع API صوتی..."

# Try to login
LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "Robintejarat@gmail.com", "password": "admin123"}' 2>/dev/null)

if echo "$LOGIN" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    log_success "احراز هویت موفق"
    
    # Test STT API
    STT=$(curl -s -X POST http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"data":"dGVzdA==","language":"fa"}' 2>/dev/null)
    
    if echo "$STT" | grep -q '"success":true'; then
        log_success "API تشخیص گفتار کار می‌کند"
        if echo "$STT" | grep -q '"fallback":true'; then
            log_info "در حالت fallback (طبیعی برای VPS)"
        fi
    else
        log_error "API تشخیص گفتار مشکل دارد"
    fi
    
    # Test Voice Analysis
    VOICE=$(curl -s -X POST http://localhost:3000/api/voice-analysis/process \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{"text":"گزارش احمد","employeeName":"احمد"}' 2>/dev/null)
    
    if echo "$VOICE" | grep -q '"success":true'; then
        log_success "API تحلیل صوتی کار می‌کند"
    else
        log_error "API تحلیل صوتی مشکل دارد"
    fi
    
else
    log_error "احراز هویت ناموفق"
fi

# Step 5: Show results
echo ""
log_info "=== خلاصه نتایج ==="
echo "🌐 سایت: https://ahmadreza-avandi.ir"
echo "🧪 تست: https://ahmadreza-avandi.ir/test-pcm-browser.html"
echo "🗄️ دیتابیس: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"
echo ""
echo "🔧 دستورات مفید:"
echo "  docker logs crm-nextjs -f    # مشاهده لاگ‌ها"
echo "  docker ps                    # وضعیت کانتینرها"
echo "  ./fix-audio-complete.sh      # تعمیر کامل"
echo ""

log_success "تست سریع تمام شد! 🎉"