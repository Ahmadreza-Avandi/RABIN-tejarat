// Enhanced Persian Speech Recognition Service
export class EnhancedPersianSpeechRecognition {
    private recognition: any = null;
    private isListening = false;
    private retryCount = 0;
    private maxRetries = 3;
    // Optional callbacks
    private onInterimCallback: ((text: string) => void) | null = null;
    private onStartCallback: (() => void) | null = null;
    private onEndCallback: (() => void) | null = null;
    private silenceTimer: any = null;
    private silenceTimeoutMs = 900;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.setupRecognition();
    }

    private setupRecognition() {
        if (!this.recognition) return;

        // Enhanced configuration for Persian
        // Use continuous to allow longer speech segments but rely on silence timeout
        this.recognition.continuous = true;
        this.recognition.interimResults = true; // Enable interim results for better UX
        this.recognition.maxAlternatives = 1; // Keep single best alternative for clarity

        // Try Persian first, then fallback languages
        this.recognition.lang = 'fa-IR';

        // Try to use offline recognition if available
        if ('webkitSpeechRecognition' in window) {
            try {
                // Some browsers support offline recognition
                (this.recognition as any).serviceURI = '';
            } catch (e) {
                // Ignore if not supported
            }
        }
    }

    // Start listening with enhanced error handling
    async startListening(): Promise<string> {
        if (!this.isSupported()) {
            throw new Error('تشخیص گفتار پشتیبانی نمی‌شود');
        }

        if (this.isListening) {
            throw new Error('در حال حاضر در حال گوش دادن است');
        }

        // Reset retry count for new session
        this.retryCount = 0;

        return new Promise((resolve, reject) => {
            let finalTranscript = '';
            let interimTranscript = '';

            // Global longer timeout as a safety (30s)
            const globalTimeout = setTimeout(() => {
                if (this.isListening) {
                    try { this.recognition.stop(); } catch (e) { }
                    this.isListening = false;
                    reject(new Error('زمان تشخیص گفتار به پایان رسید. لطفاً دوباره تلاش کنید.'));
                }
            }, 30000);

            const resetSilenceTimer = () => {
                if (this.silenceTimer) clearTimeout(this.silenceTimer);
                this.silenceTimer = setTimeout(() => {
                    // Consider speech ended after short silence
                    if (this.isListening) {
                        try { this.recognition.stop(); } catch (e) { }
                    }
                }, this.silenceTimeoutMs);
            };

            this.recognition.onstart = () => {
                console.log('🎤 شروع تشخیص گفتار فارسی');
                this.isListening = true;
                if (this.onStartCallback) this.onStartCallback();
                resetSilenceTimer();
            };

            this.recognition.onresult = (event: any) => {
                interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;

                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript + ' ';
                    }
                }

                // Provide interim updates via callback
                const cleanedInterim = this.cleanupPersianText(interimTranscript || finalTranscript);
                if (this.onInterimCallback) this.onInterimCallback(cleanedInterim);

                // Reset silence timer because we received audio
                resetSilenceTimer();

                // If there is a final result, resolve
                if (finalTranscript.trim()) {
                    clearTimeout(this.silenceTimer);
                    clearTimeout(globalTimeout);
                    this.isListening = false;
                    const cleaned = this.cleanupPersianText(finalTranscript);
                    if (this.onEndCallback) this.onEndCallback();
                    resolve(cleaned);
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error('🎤 خطا در تشخیص گفتار:', event.error);
                clearTimeout(this.silenceTimer);
                clearTimeout(globalTimeout);
                this.isListening = false;

                switch (event.error) {
                    case 'network':
                        if (this.retryCount < this.maxRetries) {
                            this.retryCount++;
                            console.log(`🔄 تلاش مجدد ${this.retryCount}/${this.maxRetries}...`);
                            setTimeout(() => {
                                try {
                                    this.recognition.start();
                                    this.isListening = true;
                                } catch (retryError) {
                                    console.error('خطا در تلاش مجدد:', retryError);
                                    reject(new Error('خطا در تلاش مجدد اتصال'));
                                }
                            }, 2000);
                            return;
                        }
                        reject(new Error('خطا در اتصال به سرویس تشخیص گفتار. لطفاً اتصال اینترنت خود را بررسی کنید.'));
                        break;

                    case 'not-allowed':
                        reject(new Error('دسترسی به میکروفون مجاز نیست. لطفاً دسترسی را فعال کنید.'));
                        break;

                    case 'no-speech':
                        reject(new Error('صدایی تشخیص داده نشد. لطفاً دوباره تلاش کنید.'));
                        break;

                    case 'audio-capture':
                        reject(new Error('خطا در ضبط صدا. لطفاً میکروفون خود را بررسی کنید.'));
                        break;

                    case 'language-not-supported':
                        this.tryAlternativeLanguage()
                            .then(resolve)
                            .catch(reject);
                        break;

                    default:
                        reject(new Error(`خطا در تشخیص گفتار: ${event.error}`));
                }
            };

            this.recognition.onend = () => {
                console.log('🎤 پایان تشخیص گفتار');
                clearTimeout(this.silenceTimer);
                clearTimeout(globalTimeout);
                this.isListening = false;
                if (!finalTranscript.trim()) {
                    // If no final transcript, reject to fallback
                    reject(new Error('هیچ متنی ثبت نشد'));
                    return;
                }
                // otherwise onresult resolved earlier
            };

            // Start recognition
            try {
                this.recognition.start();
            } catch (error) {
                this.isListening = false;
                reject(new Error('خطا در شروع تشخیص گفتار'));
            }
        });
    }

    // Allow consumers to receive interim transcript updates
    onInterim(callback: (text: string) => void) {
        this.onInterimCallback = callback;
    }

    onStart(callback: () => void) {
        this.onStartCallback = callback;
    }

    onEnd(callback: () => void) {
        this.onEndCallback = callback;
    }

    // Try alternative language settings if Persian fails
    private async tryAlternativeLanguage(): Promise<string> {
        const alternativeLanguages = ['fa', 'ar-SA', 'ar', 'en-US'];

        for (const lang of alternativeLanguages) {
            try {
                console.log(`🔄 تلاش با زبان: ${lang}`);
                this.recognition.lang = lang;

                return await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout'));
                    }, 10000);

                    this.recognition.onresult = (event: any) => {
                        clearTimeout(timeout);
                        const transcript = event.results[0][0].transcript;
                        const cleaned = this.cleanupPersianText(transcript);
                        resolve(cleaned);
                    };

                    this.recognition.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Language failed'));
                    };

                    this.recognition.start();
                });
            } catch (error) {
                console.log(`❌ زبان ${lang} کار نکرد`);
                continue;
            }
        }

        throw new Error('هیچ زبانی برای تشخیص گفتار کار نکرد');
    }

    // Clean up and improve Persian text recognition
    private cleanupPersianText(text: string): string {
        if (!text) return '';

        return text
            // Fix common recognition errors
            .replace(/\s+/g, ' ') // Multiple spaces to single space
            .replace(/^\s+|\s+$/g, '') // Trim

            // Fix Persian characters that might be misrecognized
            .replace(/ي/g, 'ی') // Arabic ya to Persian ya
            .replace(/ك/g, 'ک') // Arabic kaf to Persian kaf
            .replace(/ء/g, 'ئ') // Hamza fixes

            // Fix common word recognition issues
            .replace(/\bگزارش کار\b/gi, 'گزارش کار')
            .replace(/\bگزارش\b/gi, 'گزارش')
            .replace(/\bکار\b/gi, 'کار')
            .replace(/\bهمکار\b/gi, 'همکار')

            // Ensure proper Persian punctuation
            .replace(/\?/g, '؟')
            .replace(/;/g, '؛')

            .trim();
    }

    // Stop listening
    stopListening(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            console.log('⏹️ تشخیص گفتار متوقف شد');
        }
    }

    // Check if supported
    isSupported(): boolean {
        return this.recognition !== null;
    }

    // Check if currently listening
    isCurrentlyListening(): boolean {
        return this.isListening;
    }

    // Get supported languages info
    getSupportInfo(): {
        isSupported: boolean;
        currentLanguage: string;
        alternativeLanguages: string[];
    } {
        return {
            isSupported: this.isSupported(),
            currentLanguage: this.recognition?.lang || 'نامشخص',
            alternativeLanguages: ['fa-IR', 'fa', 'ar-SA', 'ar', 'en-US']
        };
    }

    // Test microphone access
    async testMicrophone(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ دسترسی به میکروفون تأیید شد');
            return true;
        } catch (error) {
            console.error('❌ خطا در دسترسی به میکروفون:', error);
            return false;
        }
    }

    // Fallback method for manual text input when speech recognition fails
    async getManualInput(): Promise<string> {
        return new Promise((resolve, reject) => {
            const userInput = prompt('تشخیص گفتار کار نکرد. لطفاً متن خود را تایپ کنید:\n\nمثال: "گزارش کار احمد" یا "چطور حالت؟"');

            if (userInput === null) {
                // User cancelled
                reject(new Error('کاربر عملیات را لغو کرد'));
                return;
            }

            if (!userInput.trim()) {
                reject(new Error('متن خالی وارد شده است'));
                return;
            }

            resolve(userInput.trim());
        });
    }
}

// Export singleton
export const enhancedPersianSpeechRecognition = new EnhancedPersianSpeechRecognition();