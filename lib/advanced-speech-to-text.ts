// Advanced Speech-to-Text Service with multiple providers
import { pcmConverter } from './pcm-audio-converter';

export class AdvancedSpeechToText {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private isRecording = false;
    private stream: MediaStream | null = null;

    constructor() {
        console.log('🎤 Advanced Speech-to-Text Service initialized');
    }

    // Check if browser supports audio recording
    isSupported(): boolean {
        return !!(navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === 'function' &&
            typeof window.MediaRecorder !== 'undefined');
    }

    // Start recording audio
    async startRecording(): Promise<void> {
        if (this.isRecording) {
            throw new Error('در حال حاضر ضبط در جریان است');
        }

        if (!this.isSupported()) {
            throw new Error('مرورگر شما از ضبط صدا پشتیبانی نمی‌کند');
        }

        try {
            // Get microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });

            // Clear previous chunks
            this.audioChunks = [];

            // Create MediaRecorder
            const options = {
                mimeType: 'audio/webm;codecs=opus'
            };

            // Fallback mime types if webm is not supported
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    options.mimeType = 'audio/mp4';
                } else if (MediaRecorder.isTypeSupported('audio/wav')) {
                    options.mimeType = 'audio/wav';
                } else {
                    // Use default
                    delete (options as any).mimeType;
                }
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;

            console.log('🎤 شروع ضبط صدا...');

        } catch (error) {
            console.error('خطا در شروع ضبط:', error);
            throw new Error('خطا در دسترسی به میکروفون');
        }
    }

    // Stop recording and return audio blob
    async stopRecording(): Promise<Blob> {
        if (!this.isRecording || !this.mediaRecorder) {
            throw new Error('ضبط در جریان نیست');
        }

        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error('MediaRecorder not available'));
                return;
            }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, {
                    type: this.mediaRecorder?.mimeType || 'audio/webm'
                });

                // Clean up
                this.cleanup();

                console.log('🎤 ضبط متوقف شد، حجم فایل:', audioBlob.size, 'bytes');
                resolve(audioBlob);
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('خطا در ضبط:', event);
                this.cleanup();
                reject(new Error('خطا در ضبط صدا'));
            };

            this.mediaRecorder.stop();
            this.isRecording = false;
        });
    }

    // Convert audio to text using multiple providers
    async convertToText(audioBlob: Blob): Promise<string> {
        console.log('🔄 شروع تبدیل صدا به متن...');

        // Try different providers in order of preference
        const providers = [
            () => this.convertWithSahab(audioBlob), // Sahab is our primary provider
            () => this.convertWithOpenAI(audioBlob),
            () => this.convertWithGoogleSpeech(audioBlob),
            () => this.convertWithLocalAPI(audioBlob)
        ];

        for (let i = 0; i < providers.length; i++) {
            try {
                console.log(`🔄 تلاش ${i + 1}: استفاده از provider ${providers[i].name}...`);
                const result = await providers[i]();
                if (result && result.trim()) {
                    console.log('✅ تبدیل موفق:', result.substring(0, 50) + '...');
                    return result;
                }
            } catch (error) {
                console.warn(`❌ Provider ${i + 1} failed:`, error);
                continue;
            }
        }

        throw new Error('هیچ سرویسی نتوانست صدا را به متن تبدیل کند');
    }

    // Convert using OpenAI Whisper API
    private async convertWithOpenAI(audioBlob: Blob): Promise<string> {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', 'fa'); // Persian

        const response = await fetch('/api/voice-analysis/openai-whisper', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.text || '';
    }

    // Convert using Web Speech API (fallback)
    private async convertWithWebSpeechAPI(audioBlob: Blob): Promise<string> {
        // This is a fallback - Web Speech API doesn't directly accept audio blobs
        // We'll use the existing enhanced Persian speech recognition
        throw new Error('Web Speech API requires live audio stream');
    }

    // Convert using Google Speech API
    private async convertWithGoogleSpeech(audioBlob: Blob): Promise<string> {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('language', 'fa-IR');

        const response = await fetch('/api/voice-analysis/google-speech', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Google Speech API error: ${response.status}`);
        }

        const data = await response.json();
        return data.transcript || '';
    }

    // Convert using Sahab Speech Recognition API with PCM conversion
    private async convertWithSahab(audioBlob: Blob): Promise<string> {
        console.log('🎤 تبدیل صوت با Sahab API (با PCM)...');

        try {
            // تبدیل به PCM اگر پشتیبانی شود
            let base64Audio: string;

            if (pcmConverter && typeof pcmConverter.convertRecordingToPCM === 'function') {
                console.log('🔄 تبدیل به PCM...');
                base64Audio = await pcmConverter.convertRecordingToPCM(audioBlob);
                console.log('✅ تبدیل PCM موفق، طول base64:', base64Audio.length);
            } else {
                console.log('⚠️ PCM converter در دسترس نیست، استفاده از روش معمولی...');
                base64Audio = await this.blobToBase64(audioBlob);
            }

            const response = await fetch('/api/voice-analysis/sahab-speech-recognition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: base64Audio,
                    language: 'fa',
                    format: 'pcm', // اعلام فرمت PCM
                    sampleRate: 16000,
                    channels: 1,
                    bitDepth: 16
                }),
                credentials: 'include'
            });

            console.log('📞 پاسخ Sahab API:', response.status, response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ خطای Sahab API:', response.status, errorText);
                throw new Error(`Sahab API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📥 داده‌های دریافتی از Sahab:', data);

            if (data.success && data.data && data.data.text) {
                console.log('✅ متن تشخیص داده شده:', data.data.text);
                return data.data.text;
            }

            throw new Error('Sahab API did not return recognized text');

        } catch (error) {
            console.error('❌ خطا در convertWithSahab:', error);
            throw error;
        }
    }

    // Convert base64 to blob
    private async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    // Remove data URL prefix (e.g., "data:audio/webm;base64,")
                    const base64Data = reader.result.split(',')[1];
                    resolve(base64Data);
                } else {
                    reject(new Error('Failed to convert blob to base64'));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Convert using local API
    private async convertWithLocalAPI(audioBlob: Blob): Promise<string> {
        const formData = new FormData();
        formData.append('audio', audioBlob);

        const response = await fetch('/api/voice-analysis/local-speech', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Local API error: ${response.status}`);
        }

        const data = await response.json();
        return data.text || '';
    }

    // Complete speech-to-text process
    async recordAndConvert(maxDuration: number = 30000): Promise<string> {
        console.log('🎤 شروع فرآیند کامل ضبط و تبدیل...');

        // Start recording
        await this.startRecording();

        // Set timeout for maximum recording duration
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error('زمان ضبط به پایان رسید'));
            }, maxDuration);
        });

        try {
            // Wait for user to stop or timeout
            await new Promise<void>((resolve) => {
                // In a real implementation, you'd have a UI button to stop recording
                // For now, we'll auto-stop after a short duration for testing
                setTimeout(() => {
                    resolve();
                }, 5000); // Auto-stop after 5 seconds for demo
            });

            // Stop recording and get audio
            const audioBlob = await this.stopRecording();

            // Convert to text
            const text = await this.convertToText(audioBlob);

            return text;

        } catch (error) {
            // Make sure to stop recording on error
            if (this.isRecording) {
                try {
                    await this.stopRecording();
                } catch (stopError) {
                    console.error('خطا در توقف ضبط:', stopError);
                }
            }
            throw error;
        }
    }

    // Clean up resources
    private cleanup(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
    }

    // Get recording status
    getStatus(): {
        isRecording: boolean;
        isSupported: boolean;
        duration: number;
    } {
        return {
            isRecording: this.isRecording,
            isSupported: this.isSupported(),
            duration: this.audioChunks.length * 1000 // Approximate duration
        };
    }

    // Stop current recording (public method)
    async stop(): Promise<void> {
        if (this.isRecording) {
            await this.stopRecording();
        }
        this.cleanup();
    }
}

// Export singleton
export const advancedSpeechToText = new AdvancedSpeechToText();