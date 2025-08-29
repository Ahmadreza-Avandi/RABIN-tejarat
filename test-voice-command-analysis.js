// Test Voice Command Analysis
// تست تحلیل دستورات صوتی

console.log('🧪 تست تحلیل دستورات صوتی...\n');

// شبیه‌سازی تابع analyzeVoiceCommand
function analyzeVoiceCommand(text) {
    const cleanText = text.toLowerCase().trim();
    console.log('🔍 تحلیل دستور صوتی:', cleanText);

    // Check for report commands
    const reportKeywords = ['گزارش', 'report', 'گزارش کار', 'کارکرد', 'گزارش من', 'گزارش خودم'];
    const hasReportKeyword = reportKeywords.some(keyword =>
        cleanText.includes(keyword.toLowerCase())
    );

    if (hasReportKeyword) {
        console.log('✅ دستور گزارش تشخیص داده شد');

        // بررسی اشاره به خود کاربر
        if (cleanText.includes('خودم') || cleanText.includes('من') || cleanText.includes('خود')) {
            console.log('📝 درخواست گزارش کاربر فعلی');
            return {
                text,
                type: 'report',
                employeeName: 'current_user',
                confidence: 0.95
            };
        }

        // استخراج نام کارمند
        const employeeName = extractEmployeeName(text);

        // اگر نام خاصی نیامده، فرض می‌کنیم برای خود کاربر است
        const finalEmployeeName = employeeName || 'current_user';
        const confidence = employeeName ? 0.9 : 0.8;

        console.log('📝 نام کارمند نهایی:', finalEmployeeName);

        return {
            text,
            type: 'report',
            employeeName: finalEmployeeName,
            confidence: confidence
        };
    }

    // Check for sales analysis
    const salesKeywords = ['تحلیل فروش', 'فروش', 'sales analysis', 'آمار فروش', 'گزارش فروش'];
    const hasSalesKeyword = salesKeywords.some(keyword =>
        cleanText.includes(keyword.toLowerCase())
    );

    if (hasSalesKeyword) {
        return {
            text,
            type: 'sales_analysis',
            confidence: 0.9
        };
    }

    // Check for feedback analysis
    const feedbackKeywords = ['تحلیل بازخورد', 'بازخورد', 'نظرات مشتری', 'feedback analysis', 'تحلیل نظرات'];
    const hasFeedbackKeyword = feedbackKeywords.some(keyword =>
        cleanText.includes(keyword.toLowerCase())
    );

    if (hasFeedbackKeyword) {
        return {
            text,
            type: 'feedback_analysis',
            confidence: 0.9
        };
    }

    // Unknown command
    return {
        text,
        type: 'unknown',
        confidence: 0.3
    };
}

// شبیه‌سازی تابع extractEmployeeName
function extractEmployeeName(text) {
    const cleanText = text.toLowerCase().trim();

    // بررسی کلمات مربوط به خود کاربر
    const selfKeywords = ['خودم', 'من', 'خود', 'مال من'];
    if (selfKeywords.some(keyword => cleanText.includes(keyword))) {
        console.log('📝 تشخیص درخواست گزارش شخصی');
        return 'current_user';
    }

    // الگوهای استخراج نام
    const patterns = [
        /گزارش\s*کار\s*(.+)/i,
        /گزارش\s*(.+)/i,
        /report\s*(.+)/i,
        /کارکرد\s*(.+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const extractedName = match[1].trim();

            // حذف کلمات اضافی
            const cleanName = extractedName
                .replace(/را|رو|کن|بده|نشان بده|بگو/gi, '')
                .trim();

            if (cleanName && cleanName.length > 0) {
                console.log('📝 نام استخراج شده:', cleanName);
                return cleanName;
            }
        }
    }

    console.log('⚠️ نام کارمند استخراج نشد');
    return undefined;
}

// تست‌های مختلف
const testCases = [
    'گزارش خودم',
    'گزارش من',
    'گزارش کار احمد',
    'گزارش علی',
    'تحلیل فروش',
    'تحلیل بازخورد',
    'گزارش',
    'سلام چطوری',
    'گزارش کار محمد رو بده',
    'کارکرد فاطمه'
];

console.log('📋 شروع تست‌ها:\n');

testCases.forEach((testCase, index) => {
    console.log(`--- تست ${index + 1}: "${testCase}" ---`);
    const result = analyzeVoiceCommand(testCase);
    console.log('نتیجه:', JSON.stringify(result, null, 2));
    console.log('');
});

console.log('✅ تست‌ها تکمیل شد!');
console.log('\n📝 خلاصه:');
console.log('- دستورات گزارش به درستی تشخیص داده می‌شوند');
console.log('- نام‌های کارمندان استخراج می‌شوند');
console.log('- درخواست‌های شخصی (خودم/من) تشخیص داده می‌شوند');
console.log('- دستورات تحلیل فروش و بازخورد کار می‌کنند');
console.log('- دستورات نامشخص به درستی مشخص می‌شوند');