#!/bin/bash

# Debug Problematic Services - تست و عیب‌یابی سرویس‌های مشکل‌دار
echo "🔍 شروع عیب‌یابی سرویس‌های مشکل‌دار..."

# رنگ‌ها
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_debug() { echo -e "${PURPLE}🔍 $1${NC}"; }

# تابع تست سرویس
test_service() {
    local service_name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local headers="$5"
    
    log_info "تست سرویس: $service_name"
    log_debug "URL: $url"
    log_debug "Method: $method"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            $headers \
            --connect-timeout 10 \
            --max-time 30 \
            "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            -X "$method" \
            $headers \
            --connect-timeout 10 \
            --max-time 30 \
            -d "$data" \
            "$url" 2>/dev/null)
    fi
    
    # استخراج اطلاعات پاسخ
    body=$(echo "$response" | head -n -2)
    http_code=$(echo "$response" | tail -n 2 | head -n 1)
    time_total=$(echo "$response" | tail -n 1)
    
    log_debug "HTTP Code: $http_code"
    log_debug "Response Time: ${time_total}s"
    log_debug "Response Body (first 200 chars): $(echo "$body" | head -c 200)..."
    
    # تحلیل نتیجه
    if [ "$http_code" = "200" ]; then
        log_success "$service_name: موفق"
        return 0
    elif [ "$http_code" = "401" ]; then
        log_warning "$service_name: نیاز به احراز هویت"
        return 1
    elif [ "$http_code" = "400" ]; then
        log_warning "$service_name: خطای درخواست (ممکن است داده‌های تست مشکل داشته باشد)"
        return 2
    elif [ "$http_code" = "500" ]; then
        log_error "$service_name: خطای سرور داخلی"
        return 3
    elif [ "$http_code" = "000" ]; then
        log_error "$service_name: خطای اتصال (timeout یا network)"
        return 4
    else
        log_warning "$service_name: پاسخ غیرمنتظره (HTTP: $http_code)"
        return 5
    fi
}

# بارگذاری متغیرهای محیطی
if [ -f ".env.local" ]; then
    source .env.local
    log_success "متغیرهای محیطی بارگذاری شد"
else
    log_warning "فایل .env.local یافت نشد"
fi

# تنظیم توکن پیش‌فرض
SAHAB_TOKEN=${SAHAB_API_KEY:-"eyJhbGciOiJIUzI1NiJ9.eyJzeXN0ZW0iOiJzYWhhYiIsImNyZWF0ZVRpbWUiOiIxNDA0MDYwNjIzMjM1MDA3MCIsInVuaXF1ZUZpZWxkcyI6eyJ1c2VybmFtZSI6ImU2ZTE2ZWVkLTkzNzEtNGJlOC1hZTBiLTAwNGNkYjBmMTdiOSJ9LCJncm91cE5hbWUiOiIxMmRhZWM4OWE4M2EzZWU2NWYxZjMzNTFlMTE4MGViYiIsImRhdGEiOnsic2VydmljZUlEIjoiOWYyMTU2NWMtNzFmYS00NWIzLWFkNDAtMzhmZjZhNmM1YzY4IiwicmFuZG9tVGV4dCI6Ik9WVVZyIn19.sEUI-qkb9bT9eidyrj1IWB5Kwzd8A2niYrBwe1QYfpY"}

echo ""
log_info "=== تست سرویس‌های خارجی ==="

# 1. تست Sahab Speech Recognition API
test_service "Sahab Speech Recognition" \
    "https://partai.gw.isahab.ir/speechRecognition/v1/base64" \
    "POST" \
    '{"language":"fa","data":"dGVzdA=="}' \
    '-H "Content-Type: application/json" -H "gateway-token: '$SAHAB_TOKEN'"'

# 2. تست Sahab TTS API
test_service "Sahab TTS" \
    "https://partai.gw.isahab.ir/tts/v1/base64" \
    "POST" \
    '{"text":"سلام","voice":"female"}' \
    '-H "Content-Type: application/json" -H "gateway-token: '$SAHAB_TOKEN'"'

# 3. تست اتصال عمومی اینترنت
test_service "Google DNS" \
    "https://dns.google/resolve?name=google.com&type=A" \
    "GET" \
    "" \
    ""

echo ""
log_info "=== تست سرویس‌های محلی ==="

# بررسی وضعیت سرور محلی
if curl -s http://localhost:3000/api/health &> /dev/null; then
    log_success "سرور Next.js در حال اجرا است"
    
    # 4. تست API محلی Speech Recognition
    test_service "Local Speech Recognition API" \
        "http://localhost:3000/api/voice-analysis/sahab-speech-recognition" \
        "GET" \
        "" \
        ""
    
    # 5. تست API محلی TTS
    test_service "Local TTS API" \
        "http://localhost:3000/api/voice-analysis/sahab-tts" \
        "GET" \
        "" \
        ""
    
    # 6. تست API محلی Voice Analysis
    test_service "Local Voice Analysis API" \
        "http://localhost:3000/api/voice-analysis/process" \
        "GET" \
        "" \
        ""
        
else
    log_error "سرور Next.js در حال اجرا نیست"
    log_info "برای شروع سرور: npm run dev"
fi

echo ""
log_info "=== تست شبکه و DNS ==="

# تست DNS resolution
if nslookup partai.gw.isahab.ir &> /dev/null; then
    log_success "DNS resolution برای Sahab موفق"
else
    log_error "DNS resolution برای Sahab ناموفق"
fi

# تست ping
if ping -c 1 partai.gw.isahab.ir &> /dev/null; then
    log_success "Ping به Sahab موفق"
else
    log_error "Ping به Sahab ناموفق"
fi

# تست traceroute (اختیاری)
if command -v traceroute &> /dev/null; then
    log_info "Traceroute به Sahab (اولین 5 hop):"
    traceroute -m 5 partai.gw.isahab.ir 2>/dev/null | head -6
fi

echo ""
log_info "=== تست فایل‌های پروژه ==="

# بررسی فایل‌های مهم
files_to_check=(
    "lib/pcm-audio-converter.ts"
    "lib/advanced-speech-to-text.ts"
    "lib/audio-intelligence-service.ts"
    "app/api/voice-analysis/sahab-speech-recognition/route.ts"
    "app/api/voice-analysis/sahab-tts/route.ts"
    ".env.local"
    "package.json"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        log_success "فایل موجود: $file"
    else
        log_error "فایل مفقود: $file"
    fi
done

echo ""
log_info "=== تست وابستگی‌ها ==="

# بررسی Node.js
if command -v node &> /dev/null; then
    node_version=$(node --version)
    log_success "Node.js: $node_version"
else
    log_error "Node.js نصب نشده"
fi

# بررسی npm
if command -v npm &> /dev/null; then
    npm_version=$(npm --version)
    log_success "npm: $npm_version"
else
    log_error "npm نصب نشده"
fi

# بررسی curl
if command -v curl &> /dev/null; then
    curl_version=$(curl --version | head -1)
    log_success "curl: $curl_version"
else
    log_error "curl نصب نشده"
fi

echo ""
log_info "=== تولید گزارش تشخیصی ==="

# تولید فایل گزارش
cat > diagnostic-report.txt << EOF
=== گزارش تشخیصی سیستم صوتی ===
تاریخ: $(date)
سیستم عامل: $(uname -a)

=== متغیرهای محیطی ===
SAHAB_API_KEY: $([ -n "$SAHAB_API_KEY" ] && echo "موجود" || echo "مفقود")
NODE_ENV: ${NODE_ENV:-"تنظیم نشده"}

=== وضعیت شبکه ===
DNS Sahab: $(nslookup partai.gw.isahab.ir &> /dev/null && echo "موفق" || echo "ناموفق")
Ping Sahab: $(ping -c 1 partai.gw.isahab.ir &> /dev/null && echo "موفق" || echo "ناموفق")

=== وضعیت سرور محلی ===
Next.js Server: $(curl -s http://localhost:3000/api/health &> /dev/null && echo "در حال اجرا" || echo "متوقف")

=== فایل‌های مهم ===
EOF

for file in "${files_to_check[@]}"; do
    echo "$file: $([ -f "$file" ] && echo "موجود" || echo "مفقود")" >> diagnostic-report.txt
done

log_success "گزارش تشخیصی در فایل diagnostic-report.txt ذخیره شد"

echo ""
log_info "=== پیشنهادات عیب‌یابی ==="

echo "1. 🔧 اگر Sahab API کار نمی‌کند:"
echo "   - بررسی کنید که SAHAB_API_KEY صحیح باشد"
echo "   - فایروال یا VPN ممکن است مانع شود"
echo "   - از VPS دیگری تست کنید"

echo ""
echo "2. 🔧 اگر PCM conversion کار نمی‌کند:"
echo "   - بررسی کنید که Web Audio API پشتیبانی شود"
echo "   - در مرورگر Chrome/Firefox تست کنید"
echo "   - HTTPS ضروری است برای میکروفون"

echo ""
echo "3. 🔧 اگر سرور محلی مشکل دارد:"
echo "   - npm run dev را اجرا کنید"
echo "   - پورت 3000 آزاد باشد"
echo "   - فایل .env.local را بررسی کنید"

echo ""
echo "4. 🔧 برای دیباگ بیشتر:"
echo "   - کنسول مرورگر را بررسی کنید"
echo "   - Network tab در DevTools را نگاه کنید"
echo "   - لاگ‌های سرور را بررسی کنید"

echo ""
log_success "عیب‌یابی تکمیل شد! گزارش کامل در diagnostic-report.txt موجود است."