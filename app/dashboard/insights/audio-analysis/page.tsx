'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { audioIntelligenceService } from '@/lib/audio-intelligence-service';
import { Mic, MicOff, Volume2, VolumeX, Play, Square, Loader2 } from 'lucide-react';

export default function AudioAnalysisPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    // Initialize system status
    const updateSystemStatus = () => {
      const status = audioIntelligenceService.getSystemStatus();
      setSystemStatus(status);
      setIsSpeaking(status.isSpeaking);
    };

    updateSystemStatus();

    // Update status periodically
    const interval = setInterval(updateSystemStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleVoiceInteraction = async () => {
    if (isProcessing) {
      // Stop current processing
      audioIntelligenceService.stopAudioProcessing();
      setIsProcessing(false);
      setIsListening(false);
      setIsSpeaking(false);
      return;
    }

    setIsProcessing(true);
    setIsListening(true);
    setTranscript('');
    setAiResponse('');

    try {
      const result = await audioIntelligenceService.handleVoiceInteraction();

      setTranscript(result.transcript);
      setAiResponse(result.response.text);

      if (result.success) {
        console.log('Voice interaction completed successfully');
      } else {
        console.error('Voice interaction failed');
      }

    } catch (error) {
      console.error('Error in voice interaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setAiResponse(`خطا: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setIsListening(false);
      setIsSpeaking(false);
    }
  };

  const stopAllAudio = () => {
    audioIntelligenceService.stopAudioProcessing();
    setIsProcessing(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          تحلیل صوتی هوشمند
        </h1>
        <p className="text-gray-600">
          سیستم پیشرفته تعامل صوتی با پشتیبانی کامل از زبان فارسی
        </p>
      </div>

      {/* System Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">وضعیت سیستم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">تشخیص گفتار:</span>
              <Badge variant={systemStatus?.speechRecognitionSupported ? "default" : "destructive"}>
                {systemStatus?.speechRecognitionSupported ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">تبدیل متن به گفتار:</span>
              <Badge variant={systemStatus?.ttsSupported ? "default" : "destructive"}>
                {systemStatus?.ttsSupported ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">در حال پردازش:</span>
              <Badge variant={systemStatus?.isProcessing ? "secondary" : "outline"}>
                {systemStatus?.isProcessing ? 'بله' : 'خیر'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Control Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">کنترل‌های اصلی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            {/* Primary Action Button */}
            <Button
              onClick={handleVoiceInteraction}
              disabled={!systemStatus?.speechRecognitionSupported || !systemStatus?.ttsSupported}
              className={`w-24 h-24 rounded-full transition-all duration-300 ${
                isProcessing
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-primary hover:bg-primary/90'
              }`}
              size="lg"
            >
              {isProcessing ? (
                <Square className="h-10 w-10 text-white" />
              ) : isListening ? (
                <MicOff className="h-10 w-10 text-white" />
              ) : (
                <Mic className="h-10 w-10 text-white" />
              )}
            </Button>

            {/* Status Indicator */}
            <div className="text-center">
              {isProcessing && (
                <p className="text-lg font-medium">
                  {isListening ? 'در حال گوش دادن...' : isSpeaking ? 'در حال پخش پاسخ...' : 'در حال پردازش...'}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {isProcessing
                  ? 'برای توقف کلیک کنید'
                  : 'برای شروع تعامل صوتی کلیک کنید'}
              </p>
            </div>

            {/* Stop All Button */}
            {(isProcessing || isListening || isSpeaking) && (
              <Button
                onClick={stopAllAudio}
                variant="destructive"
                className="mt-2"
              >
                توقف همه
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript and Response */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="h-4 w-4" />
              متن شناسایی شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[120px]">
              {transcript ? (
                <p className="text-gray-800 leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-gray-500 text-center italic">
                  متن شناسایی شده در اینجا نمایش داده می‌شود
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Response */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {isSpeaking ? (
                <Volume2 className="h-4 w-4 animate-pulse" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              پاسخ هوش مصنوعی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[120px]">
              {aiResponse ? (
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
              ) : (
                <p className="text-gray-500 text-center italic">
                  پاسخ هوش مصنوعی در اینجا نمایش داده می‌شود
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">راهنمای استفاده</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3 text-gray-700">دستورات گزارش:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">گزارش کار احمد</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">گزارش علی</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">report sara</Badge>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-gray-700">سوالات عمومی:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• هر سوال فارسی یا انگلیسی</li>
                <li>• درخواست اطلاعات عمومی</li>
                <li>• کمک در کارهای روزانه</li>
              </ul>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">نکات مهم:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• برای بهترین نتیجه، در محیط آرام صحبت کنید</li>
              <li>• پس از فشردن دکمه، کمی صبر کنید تا سیستم آماده شود</li>
              <li>• برای گزارش همکاران، حتماً کلمه "گزارش" را بگویید</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
