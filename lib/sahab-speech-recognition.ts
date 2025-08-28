// Sahab Speech Recognition Service
export class SahabSpeechRecognition {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private isRecording = false;
    private stream: MediaStream | null = null;
    private readonly gatewayToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzeXN0ZW0iOiJzYWhhYiIsImNyZWF0ZVRpbWUiOiIxNDA0MDYwNjIzMjM1MDA3MCIsInVuaXF1ZUZpZWxkcyI6eyJ1c2VybmFtZSI6ImU2ZTE2ZWVkLTkzNzEtNGJlOC1hZTBiLTAwNGNkYjBmMTdiOSJ9LCJncm91cE5hbWUiOiIxMmRhZWM4OWE4M2EzZWU2NWYxZjMzNTFlMTE4MGViYiIsImRhdGEiOnsic2VydmljZUlEIjoiOWYyMTU2NWMtNzFmYS00NWIzLWFkNDAtMzhmZjZhNmM1YzY4IiwicmFuZG9tVGV4dCI6Ik9WVVZyIn19.sEUI-qkb9bT9eidyrj1IWB5Kwzd8A2niYrBwe1QYfpY';

    constructor() {
        console.log('🎤 Sahab Speech Recognition Service initialized');
    }

    // Check if browser supports audio recording
    isSupported(): boolean {
        return !!(navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            window.MediaRecorder);
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

            // Create MediaRecorder with appropriate format
            const options = {
                mimeType: 'audio/webm;codecs=opus'
            };

            // Fallback mime types
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    options.mimeType = 'audio/mp4';
                } else if (MediaRecorder.isTypeSupported('audio/wav')) {
                    options.mimeType = 'audio/wav';
                } else {
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
            this.mediaRecorder.start(1000);
            this.isRecording = true;

            console.log('🎤 شروع ضبط صدا برای ساهاب...');

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

    // Convert audio blob to base64
    private async audioToBase64(audioBlob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix (data:audio/webm;base64,)
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('خطا در تبدیل فایل به base64'));
            reader.readAsDataURL(audioBlob);
        });
    }

    // Send audio to Sahab API and get text
    async convertToText(audioBlob: Blob): Promise<string> {
        try {
            console.log('🔄 تبدیل صدا به base64...');
            const base64Audio = await this.audioToBase64(audioBlob);

            console.log('📤 ارسال به API ساهاب...');

            const myHeaders = new Headers();
            myHeaders.append("gateway-token", this.gatewayToken);
            myHeaders.append("Content-Type", "application/json");

            const raw = JSON.stringify({
                "language": "fa",
                "data": base64Audio
            });

            const requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow' as RequestRedirect
            };

            const response = await fetch("https://partai.gw.isahab.ir/speechRecognition/v1/base64", requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📥 پاسخ از ساهاب:', result);

            if (result.status === 'success' && result.data && result.data.data) {
                const transcript = result.data.data;
                console.log('✅ متن تشخیص داده شده:', transcript);
                return transcript;
            } else {
                throw new Error(result.error || 'خطا در تشخیص گفتار');
            }

        } catch (error) {
            console.error('❌ خطا در تبدیل صدا به متن:', error);
            throw error;
        }
    }

    // Complete record and convert process
    async recordAndConvert(maxDuration: number = 30000): Promise<string> {
        console.log('🎤 شروع فرآیند کامل ضبط و تبدیل با ساهاب...');

        // Start recording
        await this.startRecording();

        return new Promise((resolve, reject) => {
            // Set timeout for maximum recording duration
            const timeout = setTimeout(async () => {
                try {
                    if (this.isRecording) {
                        const audioBlob = await this.stopRecording();
                        const text = await this.convertToText(audioBlob);
                        resolve(text);
                    }
                } catch (error) {
                    reject(error);
                }
            }, maxDuration);

            // For manual stop (in real implementation, you'd have a UI button)
            // For now, we'll auto-stop after the timeout
        });
    }

    // Manual stop method for UI integration
    async stopAndConvert(): Promise<string> {
        if (!this.isRecording) {
            throw new Error('ضبط در جریان نیست');
        }

        try {
            const audioBlob = await this.stopRecording();
            const text = await this.convertToText(audioBlob);
            return text;
        } catch (error) {
            this.cleanup();
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
        if (this.isRecording && this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        this.cleanup();
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
}

// Export singleton
export const sahabSpeechRecognition = new SahabSpeechRecognition();