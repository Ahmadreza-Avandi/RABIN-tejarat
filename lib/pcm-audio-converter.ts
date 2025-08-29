// PCM Audio Converter - تبدیل صوت به فرمت PCM برای API های speech recognition
export class PCMAudioConverter {
    private static instance: PCMAudioConverter;

    public static getInstance(): PCMAudioConverter {
        if (!PCMAudioConverter.instance) {
            PCMAudioConverter.instance = new PCMAudioConverter();
        }
        return PCMAudioConverter.instance;
    }

    // تبدیل فایل صوتی به PCM 16-bit 16kHz mono
    async convertToPCM(audioBlob: Blob): Promise<{
        pcmData: ArrayBuffer;
        base64: string;
        sampleRate: number;
        channels: number;
        bitDepth: number;
    }> {
        try {
            console.log('🔄 شروع تبدیل به PCM...', {
                originalSize: audioBlob.size,
                originalType: audioBlob.type
            });

            // تبدیل blob به ArrayBuffer
            const arrayBuffer = await audioBlob.arrayBuffer();

            // استفاده از Web Audio API برای decode
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000 // تنظیم sample rate به 16kHz
            });

            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            console.log('📊 مشخصات صوت اصلی:', {
                sampleRate: audioBuffer.sampleRate,
                channels: audioBuffer.numberOfChannels,
                duration: audioBuffer.duration,
                length: audioBuffer.length
            });

            // تبدیل به mono اگر stereo است
            const monoData = this.convertToMono(audioBuffer);

            // resample به 16kHz اگر نیاز باشد
            const resampledData = await this.resampleTo16kHz(monoData, audioBuffer.sampleRate, audioContext);

            // تبدیل به PCM 16-bit
            const pcm16Data = this.convertToPCM16(resampledData);

            // تبدیل به base64
            const base64 = this.arrayBufferToBase64(pcm16Data);

            console.log('✅ تبدیل PCM موفق:', {
                pcmSize: pcm16Data.byteLength,
                base64Length: base64.length,
                sampleRate: 16000,
                channels: 1,
                bitDepth: 16
            });

            // پاک‌سازی AudioContext
            await audioContext.close();

            return {
                pcmData: pcm16Data,
                base64: base64,
                sampleRate: 16000,
                channels: 1,
                bitDepth: 16
            };

        } catch (error) {
            console.error('❌ خطا در تبدیل PCM:', error);
            throw new Error(`خطا در تبدیل صوت به PCM: ${error.message}`);
        }
    }

    // تبدیل stereo به mono
    private convertToMono(audioBuffer: AudioBuffer): Float32Array {
        if (audioBuffer.numberOfChannels === 1) {
            return audioBuffer.getChannelData(0);
        }

        const leftChannel = audioBuffer.getChannelData(0);
        const rightChannel = audioBuffer.getChannelData(1);
        const monoData = new Float32Array(leftChannel.length);

        for (let i = 0; i < leftChannel.length; i++) {
            monoData[i] = (leftChannel[i] + rightChannel[i]) / 2;
        }

        return monoData;
    }

    // resample به 16kHz
    private async resampleTo16kHz(
        inputData: Float32Array,
        inputSampleRate: number,
        audioContext: AudioContext
    ): Promise<Float32Array> {
        if (inputSampleRate === 16000) {
            return inputData;
        }

        console.log(`🔄 Resampling از ${inputSampleRate}Hz به 16000Hz...`);

        // ایجاد AudioBuffer جدید با sample rate مطلوب
        const targetSampleRate = 16000;
        const ratio = inputSampleRate / targetSampleRate;
        const outputLength = Math.floor(inputData.length / ratio);

        const outputData = new Float32Array(outputLength);

        // Simple linear interpolation resampling
        for (let i = 0; i < outputLength; i++) {
            const sourceIndex = i * ratio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;

            if (index + 1 < inputData.length) {
                outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
            } else {
                outputData[i] = inputData[index];
            }
        }

        return outputData;
    }

    // تبدیل Float32Array به PCM 16-bit
    private convertToPCM16(floatData: Float32Array): ArrayBuffer {
        const pcm16 = new ArrayBuffer(floatData.length * 2);
        const view = new DataView(pcm16);

        for (let i = 0; i < floatData.length; i++) {
            // محدود کردن مقدار بین -1 و 1
            const sample = Math.max(-1, Math.min(1, floatData[i]));

            // تبدیل به 16-bit signed integer
            const pcmSample = Math.round(sample * 32767);

            // نوشتن به صورت little-endian
            view.setInt16(i * 2, pcmSample, true);
        }

        return pcm16;
    }

    // تبدیل ArrayBuffer به base64
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';

        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }

        return btoa(binary);
    }

    // تبدیل MediaRecorder blob به PCM (برای استفاده در speech recognition)
    async convertRecordingToPCM(blob: Blob): Promise<string> {
        try {
            console.log('🎤 تبدیل ضبط صوتی به PCM...');

            const result = await this.convertToPCM(blob);

            console.log('✅ تبدیل ضبط به PCM موفق:', {
                originalSize: blob.size,
                pcmSize: result.pcmData.byteLength,
                base64Length: result.base64.length
            });

            return result.base64;

        } catch (error) {
            console.error('❌ خطا در تبدیل ضبط به PCM:', error);
            throw error;
        }
    }

    // بررسی پشتیبانی Web Audio API
    static isSupported(): boolean {
        return !!(window.AudioContext || (window as any).webkitAudioContext);
    }

    // تست تبدیل با فایل نمونه
    async testConversion(): Promise<boolean> {
        try {
            console.log('🧪 تست تبدیل PCM...');

            // ایجاد یک صوت نمونه (1 ثانیه sine wave)
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const sampleRate = audioContext.sampleRate;
            const duration = 1; // 1 second
            const samples = sampleRate * duration;

            const audioBuffer = audioContext.createBuffer(1, samples, sampleRate);
            const channelData = audioBuffer.getChannelData(0);

            // تولید sine wave 440Hz
            for (let i = 0; i < samples; i++) {
                channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
            }

            // تبدیل AudioBuffer به Blob
            const wav = this.audioBufferToWav(audioBuffer);
            const blob = new Blob([wav], { type: 'audio/wav' });

            // تست تبدیل
            const result = await this.convertToPCM(blob);

            await audioContext.close();

            console.log('✅ تست PCM موفق:', {
                pcmSize: result.pcmData.byteLength,
                base64Length: result.base64.length
            });

            return true;

        } catch (error) {
            console.error('❌ تست PCM ناموفق:', error);
            return false;
        }
    }

    // تبدیل AudioBuffer به WAV (برای تست)
    private audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;

        const samples = audioBuffer.length;
        const dataSize = samples * blockAlign;
        const headerSize = 44;
        const fileSize = headerSize + dataSize;

        const arrayBuffer = new ArrayBuffer(fileSize);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, fileSize - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);

        // PCM data
        let offset = 44;
        for (let i = 0; i < samples; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                const pcmSample = Math.round(sample * 32767);
                view.setInt16(offset, pcmSample, true);
                offset += 2;
            }
        }

        return arrayBuffer;
    }
}

// Export singleton instance
export const pcmConverter = PCMAudioConverter.getInstance();