// Audio Intelligence Service - Complete voice interaction system
import { enhancedPersianSpeechRecognition } from './enhanced-persian-speech-recognition';
import { advancedSpeechToText } from './advanced-speech-to-text';
import { sahabSpeechRecognition } from './sahab-speech-recognition';
import { talkBotTTS } from './talkbot-tts';
import { sahabTTSV2 } from './sahab-tts-v2';

export interface VoiceCommand {
    text: string;
    type: 'report' | 'feedback_analysis' | 'sales_analysis' | 'profitability_analysis' | 'general' | 'unknown';
    employeeName?: string;
    timePeriod?: string;
    confidence: number;
}

export interface AIResponse {
    text: string;
    type: 'success' | 'error' | 'info';
    data?: any;
}

export class AudioIntelligenceService {
    private isProcessing = false;
    private isSpeaking = false;
    private currentSession: string | null = null;

    constructor() {
        console.log('🎯 Audio Intelligence Service initialized');
        this.checkEnvironmentCompatibility();
    }

    private checkEnvironmentCompatibility() {
        // Check if we're in a secure context (HTTPS)
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            console.warn('⚠️ Web Speech API requires a secure context (HTTPS)');
        }

        // Check if audio is supported
        if (typeof window !== 'undefined') {
            // Test audio playback
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                console.log('✅ Audio playback supported');
            };
            audio.onerror = () => {
                console.warn('⚠️ Audio playback not supported');
            };
            audio.src = 'data:audio/wav;base64,UklGRngAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';
        }

        // Check if Web Speech API is supported
        if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('❌ Web Speech API is not supported in this environment');
        }
    }

    // Helper method to find authentication token
    private findAuthToken(): string | null {
        // Try different methods to get authentication token
        let token = null;

        // Method 1: Check cookies with different possible names
        const cookies = document.cookie.split('; ');
        const possibleTokenNames = ['auth-token', 'token', 'authToken', 'jwt', 'access_token'];

        for (const tokenName of possibleTokenNames) {
            const cookieValue = cookies.find(row => row.startsWith(`${tokenName}=`))?.split('=')[1];
            if (cookieValue) {
                token = cookieValue;
                console.log(`✅ Found token in cookie: ${tokenName}`);
                break;
            }
        }

        // Method 2: Check localStorage
        if (!token) {
            for (const tokenName of possibleTokenNames) {
                const localStorageValue = localStorage.getItem(tokenName);
                if (localStorageValue) {
                    token = localStorageValue;
                    console.log(`✅ Found token in localStorage: ${tokenName}`);
                    break;
                }
            }
        }

        // Method 3: Check sessionStorage
        if (!token) {
            for (const tokenName of possibleTokenNames) {
                const sessionStorageValue = sessionStorage.getItem(tokenName);
                if (sessionStorageValue) {
                    token = sessionStorageValue;
                    console.log(`✅ Found token in sessionStorage: ${tokenName}`);
                    break;
                }
            }
        }

        console.log('🔍 Available cookies:', document.cookie);
        console.log('🔍 Token found:', token ? 'Yes' : 'No');

        return token;
    }

    // Main method to handle complete voice interaction
    async handleVoiceInteraction(): Promise<{
        transcript: string;
        response: AIResponse;
        success: boolean;
    }> {
        if (this.isProcessing) {
            throw new Error('در حال حاضر درخواست دیگری در حال پردازش است');
        }

        this.isProcessing = true;
        this.currentSession = Date.now().toString();

        try {
            console.log('🎤 شروع تعامل صوتی...');

            // Step 1: Listen to user voice
            const transcript = await this.listenToUser();
            console.log('📝 متن دریافت شده:', transcript);

            // Step 2: Analyze the command
            const command = this.analyzeVoiceCommand(transcript);
            console.log('🔍 دستور تحلیل شده:', command);

            // Step 3: Process the command
            const response = await this.processCommand(command);
            console.log('💬 پاسخ تولید شده:', response.text.substring(0, 100) + '...');

            // Step 4: Speak the response
            await this.speakResponse(response.text);

            return {
                transcript,
                response,
                success: true
            };

        } catch (error) {
            console.error('❌ خطا در تعامل صوتی:', error);

            const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
            const errorResponse: AIResponse = {
                text: `متأسفم، خطایی رخ داد: ${errorMessage}`,
                type: 'error'
            };

            // Try to speak the error message
            try {
                await this.speakResponse(errorResponse.text);
            } catch (ttsError) {
                console.error('❌ خطا در خواندن پیام خطا:', ttsError);
            }

            return {
                transcript: '',
                response: errorResponse,
                success: false
            };

        } finally {
            this.isProcessing = false;
            this.currentSession = null;
        }
    }

    // Listen to user voice input with manual control
    private async listenToUser(): Promise<string> {
        try {
            // Try Sahab Speech Recognition first (most reliable for Persian)
            if (sahabSpeechRecognition.isSupported()) {
                console.log('🎤 Using Sahab Speech Recognition service...');

                // Start recording session
                const session = await sahabSpeechRecognition.startRecordingSession();

                // Wait for user to manually stop (this will be controlled by UI)
                // For now, we'll use a timeout as fallback
                return new Promise((resolve, reject) => {
                    // Set a maximum timeout
                    const maxTimeout = setTimeout(async () => {
                        try {
                            if (session.isRecording()) {
                                const result = await session.stop();
                                resolve(result);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    }, 30000); // 30 seconds max

                    // Store session for manual control
                    (this as any).currentRecordingSession = {
                        session,
                        timeout: maxTimeout,
                        resolve,
                        reject
                    };
                });
            }

            // Fallback to advanced speech-to-text
            if (advancedSpeechToText.isSupported()) {
                console.log('🎤 Falling back to advanced speech-to-text service...');
                return await advancedSpeechToText.recordAndConvert(30000);
            }

            // Fallback to Web Speech API
            console.log('🎤 Falling back to Web Speech API...');

            // First check if we have the required APIs
            if (typeof window === 'undefined') {
                throw new Error('صفحه هنوز به طور کامل بارگذاری نشده است');
            }

            if (!window.isSecureContext) {
                throw new Error('این قابلیت نیاز به یک محیط امن (HTTPS) دارد');
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('دسترسی به میکروفون در این مرورگر یا محیط پشتیبانی نمی‌شود');
            }

            // Ensure any ongoing TTS is stopped to avoid feedback
            try {
                talkBotTTS.stop();
            } catch (e) {
                console.warn('خطا در توقف TalkBot TTS:', e);
            }
            try {
                sahabTTSV2.stop();
            } catch (e) {
                console.warn('خطا در توقف Sahab TTS:', e);
            }

            const microphoneOk = await enhancedPersianSpeechRecognition.testMicrophone();
            if (!microphoneOk) {
                console.warn('میکروفون در دسترس نیست، استفاده از ورودی دستی');
                return await enhancedPersianSpeechRecognition.getManualInput();
            }

            return await enhancedPersianSpeechRecognition.startListening();
        } catch (error) {
            console.error('خطا در تشخیص گفتار:', error);

            // Final fallback to manual input
            console.log('استفاده از ورودی دستی به عنوان fallback نهایی');
            return await enhancedPersianSpeechRecognition.getManualInput();
        }
    }

    // Listen to user and provide interim updates via callback
    async listenWithInterim(onInterim: (text: string) => void): Promise<string> {
        try {
            // Stop any TTS to avoid feedback
            try { talkBotTTS.stop(); } catch (e) { }
            try { sahabTTSV2.stop(); } catch (e) { }

            const microphoneOk = await enhancedPersianSpeechRecognition.testMicrophone();
            if (!microphoneOk) {
                console.warn('میکروفون در دسترس نیست، استفاده از ورودی دستی');
                return await enhancedPersianSpeechRecognition.getManualInput();
            }

            // Subscribe interim events
            enhancedPersianSpeechRecognition.onInterim((text: string) => {
                try {
                    onInterim(text);
                } catch (e) {
                    console.error('خطا در onInterim handler:', e);
                }
            });

            // Also notify start/end if needed
            enhancedPersianSpeechRecognition.onStart(() => { this.isProcessing = true; });
            enhancedPersianSpeechRecognition.onEnd(() => { /* noop */ });

            return await enhancedPersianSpeechRecognition.startListening();
        } catch (error) {
            console.error('خطا در تشخیص گفتار با interim:', error);
            return await enhancedPersianSpeechRecognition.getManualInput();
        }
    }

    // Analyze voice command to determine type and extract information
    private analyzeVoiceCommand(text: string): VoiceCommand {
        const cleanText = text.toLowerCase().trim();
        console.log('🔍 تحلیل دستور صوتی:', cleanText);

        // Check for report commands - بهبود یافته
        const reportKeywords = ['گزارش', 'report', 'گزارش کار', 'کارکرد', 'گزارش من', 'گزارش خودم'];
        const hasReportKeyword = reportKeywords.some(keyword =>
            cleanText.includes(keyword.toLowerCase())
        );

        if (hasReportKeyword) {
            console.log('✅ دستور گزارش تشخیص داده شد');

            // Extract employee name - بهبود یافته
            let employeeName = this.extractEmployeeName(text);

            // اگر "خودم" یا "من" گفته، نام کاربر فعلی را استفاده کن
            if (cleanText.includes('خودم') || cleanText.includes('من') || cleanText.includes('خود')) {
                employeeName = 'current_user'; // نشانگر کاربر فعلی
                console.log('📝 درخواست گزارش کاربر فعلی');
            }

            return {
                text,
                type: 'report',
                employeeName,
                confidence: employeeName ? 0.95 : 0.7
            };
        }

        // Check for feedback analysis commands
        const feedbackKeywords = ['تحلیل بازخورد', 'بازخورد', 'نظرات مشتری', 'feedback analysis', 'تحلیل نظرات'];
        const hasFeedbackKeyword = feedbackKeywords.some(keyword =>
            cleanText.includes(keyword.toLowerCase())
        );

        if (hasFeedbackKeyword) {
            const timePeriod = this.extractTimePeriod(text);
            return {
                text,
                type: 'feedback_analysis',
                timePeriod,
                confidence: timePeriod ? 0.9 : 0.7
            };
        }

        // Check for sales analysis commands
        const salesKeywords = ['تحلیل فروش', 'فروش', 'sales analysis', 'آمار فروش', 'گزارش فروش'];
        const hasSalesKeyword = salesKeywords.some(keyword =>
            cleanText.includes(keyword.toLowerCase())
        );

        if (hasSalesKeyword) {
            const timePeriod = this.extractTimePeriod(text);
            return {
                text,
                type: 'sales_analysis',
                timePeriod,
                confidence: timePeriod ? 0.9 : 0.7
            };
        }

        // Check for profitability analysis commands
        const profitabilityKeywords = ['تحلیل سودآوری', 'سودآوری', 'profitability analysis', 'تحلیل سود', 'حاشیه سود', 'سود خالص'];
        const hasProfitabilityKeyword = profitabilityKeywords.some(keyword =>
            cleanText.includes(keyword.toLowerCase())
        );

        if (hasProfitabilityKeyword) {
            const timePeriod = this.extractTimePeriod(text);
            return {
                text,
                type: 'profitability_analysis',
                timePeriod,
                confidence: timePeriod ? 0.9 : 0.7
            };
        }

        // Check for general questions
        const questionKeywords = ['چی', 'چه', 'کی', 'کجا', 'چرا', 'چگونه', 'آیا', '؟'];
        const hasQuestionKeyword = questionKeywords.some(keyword =>
            cleanText.includes(keyword)
        );

        if (hasQuestionKeyword) {
            return {
                text,
                type: 'general',
                confidence: 0.8
            };
        }

        // Unknown command
        return {
            text,
            type: 'unknown',
            confidence: 0.3
        };
    }

    // Extract employee name from voice command - بهبود یافته
    private extractEmployeeName(text: string): string | undefined {
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
            /کارکرد\s*(.+)/i,
            /گزارش\s*من/i,
            /گزارش\s*خودم/i
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

    // Extract time period from voice command
    private extractTimePeriod(text: string): string | undefined {
        const timePatterns = {
            'یک هفته': '1week',
            'هفته گذشته': '1week',
            'هفتگی': '1week',
            'یک ماه': '1month',
            'ماه گذشته': '1month',
            'ماهانه': '1month',
            'سه ماه': '3months',
            'سه ماه گذشته': '3months',
            'فصلی': '3months',
            'یک سال': '1year',
            'سال گذشته': '1year',
            'سالانه': '1year'
        };

        const cleanText = text.toLowerCase();

        for (const [keyword, period] of Object.entries(timePatterns)) {
            if (cleanText.includes(keyword)) {
                return period;
            }
        }

        // Default to 1 month if no specific period mentioned
        return '1month';
    }

    // Process the analyzed command
    private async processCommand(command: VoiceCommand): Promise<AIResponse> {
        switch (command.type) {
            case 'report':
                return await this.processReportCommand(command);

            case 'feedback_analysis':
                return await this.processFeedbackAnalysisCommand(command);

            case 'sales_analysis':
                return await this.processSalesAnalysisCommand(command);

            case 'profitability_analysis':
                return await this.processProfitabilityAnalysisCommand(command);

            case 'general':
                return await this.processGeneralCommand(command);

            default:
                return {
                    text: 'متأسفم، دستور شما را متوجه نشدم. لطفاً دوباره تلاش کنید.\n\nدستورات مجاز:\n• گزارش کار [نام همکار]\n• تحلیل فروش [بازه زمانی]\n• تحلیل بازخورد [بازه زمانی]\n• تحلیل سودآوری [بازه زمانی]\n• سوالات عمومی',
                    type: 'info'
                };
        }
    }

    // Process report-related commands - بهبود یافته
    private async processReportCommand(command: VoiceCommand): Promise<AIResponse> {
        if (!command.employeeName) {
            return {
                text: 'لطفاً نام همکار را مشخص کنید. مثال: "گزارش کار احمد" یا "گزارش خودم"',
                type: 'info'
            };
        }

        try {
            console.log('📊 پردازش درخواست گزارش برای:', command.employeeName);

            // بررسی احراز هویت
            console.log('🔍 بررسی احراز هویت...');

            const authCheck = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('🔍 وضعیت احراز هویت:', authCheck.status, authCheck.ok);

            let currentUser = null;
            if (authCheck.ok) {
                const authData = await authCheck.json();
                currentUser = authData;
                console.log('👤 کاربر فعلی:', currentUser);
            }

            // تعیین نام کارمند نهایی
            let finalEmployeeName = command.employeeName;
            if (command.employeeName === 'current_user' && currentUser) {
                finalEmployeeName = currentUser.name || currentUser.email || 'کاربر فعلی';
                console.log('📝 استفاده از نام کاربر فعلی:', finalEmployeeName);
            }

            // فراخوانی API برای دریافت گزارش
            console.log('📞 فراخوانی API تحلیل صوتی...');

            const token = this.findAuthToken();
            const headers: any = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/voice-analysis/process', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    text: command.text,
                    employeeName: finalEmployeeName,
                    originalCommand: command.employeeName,
                    isCurrentUser: command.employeeName === 'current_user'
                })
            });

            console.log('📞 پاسخ API تحلیل صوتی:', response.status, response.ok);

            const data = await response.json();
            console.log('📞 داده‌های دریافتی:', data);

            if (response.ok && data.success) {
                if (data.data.employee_found) {
                    const reportText = command.employeeName === 'current_user'
                        ? `گزارش شما:\n\n${data.data.analysis}`
                        : `گزارش همکار ${data.data.employee_name}:\n\n${data.data.analysis}`;

                    return {
                        text: reportText,
                        type: 'success',
                        data: data.data
                    };
                } else {
                    const notFoundText = command.employeeName === 'current_user'
                        ? 'گزارشی برای شما یافت نشد.'
                        : `همکار "${finalEmployeeName}" در سیستم یافت نشد. لطفاً نام را بررسی کنید.`;

                    return {
                        text: notFoundText,
                        type: 'info'
                    };
                }
            } else {
                console.error('❌ خطای API:', response.status, data);
                return {
                    text: `خطا در دریافت گزارش: ${data.message || 'خطای نامشخص'} (وضعیت: ${response.status})`,
                    type: 'error'
                };
            }

        } catch (error) {
            console.error('خطا در پردازش گزارش:', error);
            return {
                text: 'خطا در دریافت گزارش. لطفاً دوباره تلاش کنید.',
                type: 'error'
            };
        }
    }

    // Process feedback analysis commands
    private async processFeedbackAnalysisCommand(command: VoiceCommand): Promise<AIResponse> {
        try {
            console.log('🔍 Processing feedback analysis command...');

            const timePeriod = command.timePeriod || '1month';
            const endDate = new Date().toISOString().split('T')[0];
            let startDate = '';

            // Calculate start date based on period
            switch (timePeriod) {
                case '1week':
                    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                case '1month':
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                case '3months':
                    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                case '1year':
                    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                default:
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }

            // Try to get token for backup
            const token = this.findAuthToken();
            const headers: any = {
                'Content-Type': 'application/json',
            };

            // Add Authorization header if token found
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/voice-analysis/feedback-analysis', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    startDate,
                    endDate,
                    period: timePeriod
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const periodName = this.getPeriodName(timePeriod);
                let responseText = `📊 تحلیل بازخوردها برای ${periodName}:\n\n`;

                responseText += `📝 خلاصه: ${data.summary}\n\n`;

                if (data.sentiment_analysis) {
                    responseText += `😊 تحلیل احساسات:\n`;
                    responseText += `• مثبت: ${data.sentiment_analysis.positive}%\n`;
                    responseText += `• خنثی: ${data.sentiment_analysis.neutral}%\n`;
                    responseText += `• منفی: ${data.sentiment_analysis.negative}%\n\n`;
                }

                if (data.recommendations && data.recommendations.length > 0) {
                    responseText += `💡 پیشنهادات اصلی:\n`;
                    data.recommendations.slice(0, 3).forEach((rec: string, index: number) => {
                        responseText += `${index + 1}. ${rec}\n`;
                    });
                }

                return {
                    text: responseText,
                    type: 'success',
                    data: data
                };
            } else {
                return {
                    text: `خطا در تحلیل بازخوردها: ${data.message || 'خطای نامشخص'}`,
                    type: 'error'
                };
            }

        } catch (error) {
            console.error('خطا در تحلیل بازخوردها:', error);
            return {
                text: 'خطا در تحلیل بازخوردها. لطفاً دوباره تلاش کنید.',
                type: 'error'
            };
        }
    }

    // Process sales analysis commands
    private async processSalesAnalysisCommand(command: VoiceCommand): Promise<AIResponse> {
        try {
            console.log('🔍 Processing sales analysis command...');

            const timePeriod = command.timePeriod || '1month';
            const endDate = new Date().toISOString().split('T')[0];
            let startDate = '';

            // Calculate start date based on period
            switch (timePeriod) {
                case '1week':
                    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                case '1month':
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                case '3months':
                    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                case '1year':
                    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                default:
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }

            // Try to get token for backup
            const token = this.findAuthToken();
            const headers: any = {
                'Content-Type': 'application/json',
            };

            // Add Authorization header if token found
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/voice-analysis/sales-analysis', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    startDate,
                    endDate,
                    period: timePeriod
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const periodName = this.getPeriodName(timePeriod);
                let responseText = `💰 تحلیل فروش برای ${periodName}:\n\n`;

                responseText += `📝 خلاصه: ${data.summary}\n\n`;

                if (data.sales_metrics) {
                    responseText += `📊 آمار کلیدی:\n`;
                    responseText += `• مجموع فروش: ${data.sales_metrics.total_sales.toLocaleString()} تومان\n`;
                    responseText += `• سود خالص: ${data.sales_metrics.total_profit.toLocaleString()} تومان\n`;
                    responseText += `• تعداد سفارشات: ${data.sales_metrics.order_count}\n`;
                    responseText += `• میانگین سفارش: ${data.sales_metrics.avg_order_value.toLocaleString()} تومان\n\n`;
                }

                if (data.top_products && data.top_products.length > 0) {
                    responseText += `🏆 محصولات پرفروش:\n`;
                    data.top_products.slice(0, 3).forEach((product: any, index: number) => {
                        responseText += `${index + 1}. ${product.name}: ${product.sales_count} فروش\n`;
                    });
                    responseText += '\n';
                }

                if (data.recommendations && data.recommendations.length > 0) {
                    responseText += `💡 پیشنهادات اصلی:\n`;
                    data.recommendations.slice(0, 3).forEach((rec: string, index: number) => {
                        responseText += `${index + 1}. ${rec}\n`;
                    });
                }

                return {
                    text: responseText,
                    type: 'success',
                    data: data
                };
            } else {
                return {
                    text: `خطا در تحلیل فروش: ${data.message || 'خطای نامشخص'}`,
                    type: 'error'
                };
            }

        } catch (error) {
            console.error('خطا در تحلیل فروش:', error);
            return {
                text: 'خطا در تحلیل فروش. لطفاً دوباره تلاش کنید.',
                type: 'error'
            };
        }
    }

    // Process profitability analysis commands
    private async processProfitabilityAnalysisCommand(command: VoiceCommand): Promise<AIResponse> {
        try {
            console.log('🔍 Processing profitability analysis command...');

            const timePeriod = command.timePeriod || '1month';
            const endDate = new Date().toISOString().split('T')[0];
            let startDate = '';

            // Calculate start date based on period
            switch (timePeriod) {
                case '1week':
                    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                case '1month':
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                case '3months':
                    startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                case '1year':
                    startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    break;
                default:
                    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }

            // Try to get token for backup
            const token = this.findAuthToken();
            const headers: any = {
                'Content-Type': 'application/json',
            };

            // Add Authorization header if token found
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/voice-analysis/profitability-analysis', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    startDate,
                    endDate,
                    period: timePeriod
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const periodName = this.getPeriodName(timePeriod);
                let responseText = `💎 تحلیل سودآوری برای ${periodName}:\n\n`;

                responseText += `📝 خلاصه: ${data.summary}\n\n`;

                if (data.profitability_metrics) {
                    responseText += `📊 شاخص‌های سودآوری:\n`;
                    responseText += `• درآمد کل: ${data.profitability_metrics.total_revenue.toLocaleString()} تومان\n`;
                    responseText += `• هزینه کل: ${data.profitability_metrics.total_costs.toLocaleString()} تومان\n`;
                    responseText += `• سود خالص: ${data.profitability_metrics.net_profit.toLocaleString()} تومان\n`;
                    responseText += `• حاشیه سود: ${data.profitability_metrics.profit_margin}%\n`;
                    responseText += `• بازده سرمایه: ${data.profitability_metrics.roi}%\n\n`;
                }

                if (data.cost_breakdown && data.cost_breakdown.length > 0) {
                    responseText += `💰 تفکیک هزینه‌ها:\n`;
                    data.cost_breakdown.slice(0, 3).forEach((cost: any, index: number) => {
                        responseText += `${index + 1}. ${cost.category}: ${cost.amount.toLocaleString()} تومان\n`;
                    });
                    responseText += '\n';
                }

                if (data.recommendations && data.recommendations.length > 0) {
                    responseText += `💡 پیشنهادات بهبود سودآوری:\n`;
                    data.recommendations.slice(0, 3).forEach((rec: string, index: number) => {
                        responseText += `${index + 1}. ${rec}\n`;
                    });
                }

                return {
                    text: responseText,
                    type: 'success',
                    data: data
                };
            } else {
                return {
                    text: `خطا در تحلیل سودآوری: ${data.message || 'خطای نامشخص'}`,
                    type: 'error'
                };
            }

        } catch (error) {
            console.error('خطا در تحلیل سودآوری:', error);
            return {
                text: 'خطا در تحلیل سودآوری. لطفاً دوباره تلاش کنید.',
                type: 'error'
            };
        }
    }

    // Get period name in Persian
    private getPeriodName(period: string): string {
        switch (period) {
            case '1week':
                return 'یک هفته گذشته';
            case '1month':
                return 'یک ماه گذشته';
            case '3months':
                return 'سه ماه گذشته';
            case '1year':
                return 'یک سال گذشته';
            default:
                return 'دوره انتخاب شده';
        }
    }

    // Process general questions
    private async processGeneralCommand(command: VoiceCommand): Promise<AIResponse> {
        try {
            const encodedText = encodeURIComponent(command.text);
            const response = await fetch(`https://mine-gpt-alpha.vercel.app/proxy?text=${encodedText}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            const data = await response.json();
            const aiText = data.answer || data.response || data.text || data;

            if (aiText && typeof aiText === 'string') {
                return {
                    text: aiText,
                    type: 'success'
                };
            } else {
                return {
                    text: 'متأسفم، نتوانستم پاسخ مناسبی تولید کنم.',
                    type: 'info'
                };
            }

        } catch (error) {
            console.error('خطا در پردازش سوال عمومی:', error);
            return {
                text: 'خطا در دریافت پاسخ از هوش مصنوعی. لطفاً دوباره تلاش کنید.',
                type: 'error'
            };
        }
    }

    // Speak the response using Sahab TTS (new API)
    private async speakResponse(text: string): Promise<void> {
        try {
            // Set speaking state
            this.isSpeaking = true;

            console.log('🎵 Using Sahab TTS for response...');

            // Use new Sahab TTS API
            await sahabTTSV2.speakClean(text, {
                speaker: '3',
                onLoadingStart: () => {
                    console.log('🔄 شروع بارگذاری صدا...');
                },
                onLoadingEnd: () => {
                    console.log('✅ بارگذاری صدا تکمیل شد');
                },
                onError: (error) => {
                    console.error('❌ خطا در TTS:', error);
                    // Fallback to TalkBot if Sahab fails
                    this.fallbackToTalkBot(text);
                }
            });

        } catch (error) {
            console.error('خطا در خواندن پاسخ با Sahab TTS:', error);

            // Fallback to TalkBot TTS
            await this.fallbackToTalkBot(text);
        } finally {
            // Reset speaking state
            this.isSpeaking = false;
        }
    }

    // Fallback to TalkBot TTS if Sahab fails
    private async fallbackToTalkBot(text: string): Promise<void> {
        try {
            console.log('🔄 Falling back to TalkBot TTS...');
            await talkBotTTS.speak(text, { server: 'farsi', sound: '3' });
        } catch (fallbackError) {
            console.error('خطا در fallback TTS:', fallbackError);
            // Don't throw error for TTS issues - just log them
            // The main interaction should continue even if TTS fails
            console.warn('Both TTS services failed but continuing with interaction');
        }
    }

    // Stop current recording and process the result
    async stopCurrentRecording(): Promise<void> {
        const currentSession = (this as any).currentRecordingSession;
        if (currentSession) {
            try {
                clearTimeout(currentSession.timeout);
                const result = await currentSession.session.stop();
                currentSession.resolve(result);
                (this as any).currentRecordingSession = null;
                console.log('✅ ضبط متوقف شد و در حال پردازش...');
            } catch (error) {
                currentSession.reject(error);
                (this as any).currentRecordingSession = null;
            }
        }
    }

    // Stop any ongoing audio processing
    stopAudioProcessing(): void {
        // Stop current recording session if exists
        const currentSession = (this as any).currentRecordingSession;
        if (currentSession) {
            clearTimeout(currentSession.timeout);
            currentSession.reject(new Error('عملیات توسط کاربر لغو شد'));
            (this as any).currentRecordingSession = null;
        }

        enhancedPersianSpeechRecognition.stopListening();
        advancedSpeechToText.stop();
        sahabSpeechRecognition.stop();
        talkBotTTS.stop();
        sahabTTSV2.stop();
        this.isProcessing = false;
        this.currentSession = null;
        console.log('⏹️ پردازش صوتی متوقف شد');
    }

    // Get system status
    getSystemStatus(): {
        isProcessing: boolean;
        isSpeaking: boolean;
        speechRecognitionSupported: boolean;
        ttsSupported: boolean;
        currentSession: string | null;
        voiceInfo: any;
        sahabTTSStatus: any;
        advancedSpeechStatus: any;
        sahabSpeechStatus: any;
    } {
        const sahabTTSStatus = sahabTTSV2.getStatus();
        const advancedSpeechStatus = advancedSpeechToText.getStatus();
        const sahabSpeechStatus = sahabSpeechRecognition.getStatus();

        return {
            isProcessing: this.isProcessing,
            isSpeaking: this.isSpeaking || sahabTTSStatus.isSpeaking,
            speechRecognitionSupported: enhancedPersianSpeechRecognition.isSupported() ||
                advancedSpeechStatus.isSupported ||
                sahabSpeechStatus.isSupported,
            ttsSupported: talkBotTTS.isSupported() || sahabTTSV2.isSupported(),
            currentSession: this.currentSession,
            voiceInfo: {
                total: 3,
                persian: 3,
                arabic: 0,
                female: 1,
                bestVoice: 'Sahab Speech Recognition + Sahab TTS (Primary) + Fallbacks',
                hasGoodVoice: true
            },
            sahabTTSStatus: sahabTTSStatus,
            advancedSpeechStatus: advancedSpeechStatus,
            sahabSpeechStatus: sahabSpeechStatus
        };
    }

    // Test the complete system
    async testSystem(): Promise<{
        speechRecognition: boolean;
        advancedSpeechToText: boolean;
        sahabSpeechRecognition: boolean;
        textToSpeech: boolean;
        microphone: boolean;
        overall: boolean;
    }> {
        const results = {
            speechRecognition: enhancedPersianSpeechRecognition.isSupported(),
            advancedSpeechToText: advancedSpeechToText.isSupported(),
            sahabSpeechRecognition: sahabSpeechRecognition.isSupported(),
            textToSpeech: talkBotTTS.isSupported() || sahabTTSV2.isSupported(),
            microphone: false,
            overall: false
        };

        try {
            results.microphone = await sahabSpeechRecognition.testMicrophone();
        } catch (error) {
            console.error('خطا در تست میکروفون:', error);
        }

        results.overall = (results.speechRecognition ||
            results.advancedSpeechToText ||
            results.sahabSpeechRecognition) &&
            results.textToSpeech &&
            results.microphone;

        return results;
    }
}

// Export singleton
export const audioIntelligenceService = new AudioIntelligenceService();
