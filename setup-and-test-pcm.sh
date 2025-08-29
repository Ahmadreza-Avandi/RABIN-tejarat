#!/bin/bash

# Setup and Test PCM - راه‌اندازی و تست کامل سیستم PCM
echo "🚀 راه‌اندازی و تست کامل سیستم PCM..."

# رنگ‌ها
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_debug() { echo -e "${PURPLE}🔍 $1${NC}"; }
log_step() { echo -e "${CYAN}🔧 $1${NC}"; }

# تابع بررسی وضعیت
check_status() {
    if [ $? -eq 0 ]; then
        log_success "$1"
        return 0
    else
        log_error "$1"
        return 1
    fi
}

echo ""
log_step "مرحله 1: بررسی پیش‌نیازها"

# بررسی Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js: $NODE_VERSION"
else
    log_error "Node.js نصب نشده"
    exit 1
fi

# بررسی npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "npm: $NPM_VERSION"
else
    log_error "npm نصب نشده"
    exit 1
fi

# بررسی فایل‌های ضروری
REQUIRED_FILES=(
    "lib/pcm-audio-converter.ts"
    "lib/advanced-speech-to-text.ts"
    "app/api/voice-analysis/sahab-speech-recognition/route.ts"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "فایل موجود: $file"
    else
        log_error "فایل مفقود: $file"
        exit 1
    fi
done

echo ""
log_step "مرحله 2: بررسی و نصب وابستگی‌ها"

# بررسی package.json
if [ -f "package.json" ]; then
    log_info "بررسی وابستگی‌ها..."
    
    # نصب وابستگی‌ها اگر node_modules وجود ندارد
    if [ ! -d "node_modules" ]; then
        log_info "نصب وابستگی‌ها..."
        npm install
        check_status "نصب وابستگی‌ها"
    else
        log_success "وابستگی‌ها قبلاً نصب شده‌اند"
    fi
else
    log_error "فایل package.json یافت نشد"
    exit 1
fi

echo ""
log_step "مرحله 3: بررسی متغیرهای محیطی"

# بررسی .env.local
if [ -f ".env.local" ]; then
    source .env.local
    log_success "فایل .env.local بارگذاری شد"
    
    if [ -n "$SAHAB_API_KEY" ]; then
        log_success "SAHAB_API_KEY موجود است"
    else
        log_warning "SAHAB_API_KEY تنظیم نشده"
    fi
else
    log_warning "فایل .env.local یافت نشد"
    log_info "ایجاد فایل .env.local نمونه..."
    
    cat > .env.local << 'EOF'
# Sahab API Configuration
SAHAB_API_KEY=eyJhbGciOiJIUzI1NiJ9.eyJzeXN0ZW0iOiJzYWhhYiIsImNyZWF0ZVRpbWUiOiIxNDA0MDYwNjIzMjM1MDA3MCIsInVuaXF1ZUZpZWxkcyI6eyJ1c2VybmFtZSI6ImU2ZTE2ZWVkLTkzNzEtNGJlOC1hZTBiLTAwNGNkYjBmMTdiOSJ9LCJncm91cE5hbWUiOiIxMmRhZWM4OWE4M2EzZWU2NWYxZjMzNTFlMTE4MGViYiIsImRhdGEiOnsic2VydmljZUlEIjoiOWYyMTU2NWMtNzFmYS00NWIzLWFkNDAtMzhmZjZhNmM1YzY4IiwicmFuZG9tVGV4dCI6Ik9WVVZyIn19.sEUI-qkb9bT9eidyrj1IWB5Kwzd8A2niYrBwe1QYfpY

# Development
NODE_ENV=development
EOF
    
    log_success "فایل .env.local ایجاد شد"
    source .env.local
fi

echo ""
log_step "مرحله 4: تست اتصال شبکه"

# تست DNS
if nslookup partai.gw.isahab.ir &> /dev/null; then
    log_success "DNS resolution موفق"
else
    log_error "DNS resolution ناموفق"
fi

# تست ping
if ping -c 1 partai.gw.isahab.ir &> /dev/null; then
    log_success "Ping موفق"
else
    log_warning "Ping ناموفق (ممکن است ICMP مسدود باشد)"
fi

# تست HTTP
SAHAB_TOKEN=${SAHAB_API_KEY:-"eyJhbGciOiJIUzI1NiJ9.eyJzeXN0ZW0iOiJzYWhhYiIsImNyZWF0ZVRpbWUiOiIxNDA0MDYwNjIzMjM1MDA3MCIsInVuaXF1ZUZpZWxkcyI6eyJ1c2VybmFtZSI6ImU2ZTE2ZWVkLTkzNzEtNGJlOC1hZTBiLTAwNGNkYjBmMTdiOSJ9LCJncm91cE5hbWUiOiIxMmRhZWM4OWE4M2EzZWU2NWYxZjMzNTFlMTE4MGViYiIsImRhdGEiOnsic2VydmljZUlEIjoiOWYyMTU2NWMtNzFmYS00NWIzLWFkNDAtMzhmZjZhNmM1YzY4IiwicmFuZG9tVGV4dCI6Ik9WVVZyIn19.sEUI-qkb9bT9eidyrj1IWB5Kwzd8A2niYrBwe1QYfpY"}

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "gateway-token: $SAHAB_TOKEN" \
    -X POST \
    --connect-timeout 10 \
    --max-time 30 \
    "https://partai.gw.isahab.ir/speechRecognition/v1/base64" \
    -d '{"language":"fa","data":"dGVzdA=="}' 2>/dev/null)

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "400" ]; then
    log_success "Sahab API در دسترس است (HTTP: $HTTP_STATUS)"
elif [ "$HTTP_STATUS" = "000" ]; then
    log_error "خطای اتصال به Sahab API"
else
    log_warning "Sahab API پاسخ غیرمنتظره (HTTP: $HTTP_STATUS)"
fi

echo ""
log_step "مرحله 5: تست PCM conversion"

# اجرای تست سریع PCM
if [ -f "test-pcm-quick.sh" ]; then
    log_info "اجرای تست سریع PCM..."
    ./test-pcm-quick.sh
else
    log_warning "فایل test-pcm-quick.sh یافت نشد"
fi

echo ""
log_step "مرحله 6: شروع سرور توسعه"

# بررسی اینکه آیا سرور در حال اجرا است
if curl -s http://localhost:3000/api/health &> /dev/null; then
    log_success "سرور قبلاً در حال اجرا است"
    SERVER_RUNNING=true
else
    log_info "شروع سرور Next.js..."
    
    # شروع سرور در پس‌زمینه
    npm run dev > server.log 2>&1 &
    SERVER_PID=$!
    
    log_info "سرور شروع شد (PID: $SERVER_PID)"
    log_info "منتظر آماده شدن سرور..."
    
    # انتظار برای آماده شدن سرور
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health &> /dev/null; then
            log_success "سرور آماده است"
            SERVER_RUNNING=true
            break
        fi
        sleep 2
        echo -n "."
    done
    echo ""
    
    if [ "$SERVER_RUNNING" != "true" ]; then
        log_error "سرور آماده نشد"
        if [ -n "$SERVER_PID" ]; then
            kill $SERVER_PID 2>/dev/null
        fi
        exit 1
    fi
fi

echo ""
log_step "مرحله 7: تست API های محلی"

# تست API endpoint ها
ENDPOINTS=(
    "GET /api/health"
    "GET /api/voice-analysis/sahab-speech-recognition"
    "GET /api/voice-analysis/sahab-tts"
)

for endpoint in "${ENDPOINTS[@]}"; do
    method=$(echo $endpoint | cut -d' ' -f1)
    path=$(echo $endpoint | cut -d' ' -f2)
    
    status=$(curl -s -o /dev/null -w "%{http_code}" -X $method "http://localhost:3000$path" 2>/dev/null)
    
    if [ "$status" = "200" ]; then
        log_success "$endpoint: موفق"
    elif [ "$status" = "401" ]; then
        log_success "$endpoint: در دسترس (نیاز به احراز هویت)"
    else
        log_warning "$endpoint: HTTP $status"
    fi
done

echo ""
log_step "مرحله 8: ایجاد فایل‌های تست"

# کپی فایل تست HTML به public
if [ -f "test-pcm-browser.html" ]; then
    if [ -d "public" ]; then
        cp test-pcm-browser.html public/
        log_success "فایل تست HTML کپی شد به public/"
    else
        log_warning "پوشه public یافت نشد"
    fi
fi

echo ""
log_step "مرحله 9: خلاصه و دستورالعمل‌ها"

echo ""
log_success "=== راه‌اندازی تکمیل شد! ==="
echo ""
log_info "🌐 سرور در حال اجرا: http://localhost:3000"
log_info "🧪 صفحه تست PCM: http://localhost:3000/test-pcm-browser.html"
echo ""
log_info "📋 دستورات مفید:"
log_info "  • تست سریع PCM: ./test-pcm-quick.sh"
log_info "  • دیباگ کامل: ./debug-audio-pcm.sh"
log_info "  • عیب‌یابی سرویس‌ها: ./debug-problematic-services.sh"
echo ""
log_info "🔍 برای تست:"
log_info "  1. به http://localhost:3000/test-pcm-browser.html بروید"
log_info "  2. تست‌های مختلف را اجرا کنید"
log_info "  3. کنسول مرورگر را برای جزئیات بررسی کنید"
echo ""
log_info "📝 فایل‌های لاگ:"
log_info "  • server.log: لاگ سرور Next.js"
log_info "  • diagnostic-report.txt: گزارش تشخیصی (بعد از اجرای debug)"
echo ""

# نمایش وضعیت نهایی
if [ "$SERVER_RUNNING" = "true" ]; then
    log_success "✨ همه چیز آماده است! سرور در حال اجرا و تست‌ها قابل اجرا هستند."
    echo ""
    log_info "برای توقف سرور: Ctrl+C یا kill $SERVER_PID"
else
    log_warning "⚠️ سرور شروع نشد، لطفاً دستی اجرا کنید: npm run dev"
fi

echo ""
log_info "🎯 حالا می‌تونید بگید 'گزارش احمد' و ببینید PCM کار می‌کنه یا نه!"