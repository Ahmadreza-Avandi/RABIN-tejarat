#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🎤 تست سیستم صوتی VPS...${NC}"

# تست PulseAudio
echo -e "${BLUE}📢 تست PulseAudio...${NC}"
pulseaudio --check
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PulseAudio در حال اجراست${NC}"
else
    echo -e "${RED}❌ PulseAudio اجرا نیست - راه‌اندازی مجدد...${NC}"
    pulseaudio -D --system
fi

# تست ALSA
echo -e "${BLUE}🔊 تست ALSA...${NC}"
aplay -l
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ALSA درست کار می‌کند${NC}"
else
    echo -e "${RED}❌ مشکل در ALSA${NC}"
fi

# تست دسترسی به دستگاه‌های صوتی
echo -e "${BLUE}🎯 تست دسترسی به دستگاه‌های صوتی...${NC}"
ls -l /dev/snd/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ دسترسی به دستگاه‌های صوتی وجود دارد${NC}"
else
    echo -e "${RED}❌ مشکل در دسترسی به دستگاه‌های صوتی${NC}"
fi

# تست API صوتی
echo -e "${BLUE}🔌 تست API صوتی...${NC}"
TOKEN=$(cat auth.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -s -X POST "https://ahmadreza-avandi.ir/api/voice/test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"test": true}'

# تست ضبط صدا
echo -e "${BLUE}🎙️ تست ضبط صدا...${NC}"
arecord -d 1 -f cd test.wav 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ضبط صدا موفق${NC}"
    rm test.wav
else
    echo -e "${RED}❌ مشکل در ضبط صدا${NC}"
fi

echo -e "${BLUE}📋 وضعیت نهایی:${NC}"
pactl list sinks short
pactl list sources short
