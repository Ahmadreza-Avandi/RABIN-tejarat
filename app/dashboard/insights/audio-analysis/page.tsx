'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { audioIntelligenceService } from '@/lib/audio-intelligence-service';
import { advancedSpeechToText } from '@/lib/advanced-speech-to-text';
import { sahabSpeechRecognition } from '@/lib/sahab-speech-recognition';
import { sahabTTSV2 } from '@/lib/sahab-tts-v2';
import { enhancedPersianSpeechRecognition } from '@/lib/enhanced-persian-speech-recognition';
import { Mic, MicOff, Volume2, VolumeX, Play, Square, Loader2, MessageCircle, BarChart3, TrendingUp, DollarSign, Calendar, Clock, Headphones, Settings, Activity, Users, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react';

export default function AudioAnalysisPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');

  // Voice-controlled time selection
  const [isVoiceTimeSelection, setIsVoiceTimeSelection] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('');

  // Feedback analysis states
  const [feedbackPeriod, setFeedbackPeriod] = useState<string>('');
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<any>(null);
  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Sales analysis states
  const [salesPeriod, setSalesPeriod] = useState<string>('');
  const [salesAnalysis, setSalesAnalysis] = useState<any>(null);
  const [isAnalyzingSales, setIsAnalyzingSales] = useState(false);
  const [salesError, setSalesError] = useState('');

  // Profitability analysis states
  const [profitabilityPeriod, setProfitabilityPeriod] = useState<string>('');
  const [profitabilityAnalysis, setProfitabilityAnalysis] = useState<any>(null);
  const [isAnalyzingProfitability, setIsAnalyzingProfitability] = useState(false);
  const [profitabilityError, setProfitabilityError] = useState('');

  // Advanced audio features
  const [audioSettings, setAudioSettings] = useState({
    voiceSpeed: 1,
    voiceVolume: 1,
    autoSpeak: true,
    continuousListening: false,
    preferredTTS: 'sahab' // 'sahab' or 'talkbot'
  });

  // TTS Status
  const [ttsStatus, setTtsStatus] = useState({
    isLoading: false,
    error: null as string | null,
    currentService: 'sahab'
  });

  // Fixed speaker - always use speaker 3

  // Voice commands history
  const [commandHistory, setCommandHistory] = useState<Array<{
    timestamp: string;
    command: string;
    response: string;
    success: boolean;
  }>>([]);

  // TTS Request logs
  const [ttsLogs, setTtsLogs] = useState<Array<{
    timestamp: string;
    text: string;
    speaker: string;
    status: 'loading' | 'success' | 'error';
    error?: string;
    duration?: number;
  }>>([]);

  useEffect(() => {
    // Initialize system status
    const updateSystemStatus = () => {
      const status = audioIntelligenceService.getSystemStatus();
      setSystemStatus(status);
      setIsSpeaking(status.isSpeaking);

      // Update TTS status from Sahab
      if (status.sahabTTSStatus) {
        setTtsStatus(prev => ({
          ...prev,
          isLoading: status.sahabTTSStatus.isLoading,
          currentService: status.sahabTTSStatus.isSpeaking ? 'sahab' : prev.currentService
        }));
      }
    };

    // Load available speakers
    updateSystemStatus();

    // Update status periodically
    const interval = setInterval(updateSystemStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleVoiceInteraction = async () => {
    if (isProcessing) {
      // Stop current recording and process the result
      try {
        setCurrentTask('در حال پردازش صدای ضبط شده...');
        await audioIntelligenceService.stopCurrentRecording();
        // The processing will continue automatically after stopping
      } catch (error) {
        console.error('خطا در توقف ضبط:', error);
        audioIntelligenceService.stopAudioProcessing();
        setIsProcessing(false);
        setIsListening(false);
        setIsSpeaking(false);
        setProcessingProgress(0);
        setCurrentTask('');
      }
      return;
    }

    setIsProcessing(true);
    setIsListening(true);
    setTranscript('');
    setAiResponse('');
    setProcessingProgress(0);
    setCurrentTask('آماده‌سازی سیستم...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);

      setCurrentTask('در حال گوش دادن...');
      const result = await audioIntelligenceService.handleVoiceInteraction();

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setCurrentTask('تکمیل شد');

      setTranscript(result.transcript);
      setAiResponse(result.response.text);

      // Add to command history
      const historyEntry = {
        timestamp: new Date().toLocaleString('fa-IR'),
        command: result.transcript,
        response: result.response.text,
        success: result.success
      };
      setCommandHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

      // Check for time selection commands
      await handleVoiceTimeSelection(result.transcript);

      if (result.success) {
        console.log('Voice interaction completed successfully');
      } else {
        console.error('Voice interaction failed');
      }

    } catch (error) {
      console.error('Error in voice interaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setAiResponse(`خطا: ${errorMessage}`);
      setCurrentTask('خطا رخ داد');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setIsListening(false);
        setIsSpeaking(false);
        setProcessingProgress(0);
        setCurrentTask('');
      }, 1000);
    }
  };

  // --- Push-to-talk handlers (start on press, stop on release) ---
  const handlePushStart = async () => {
    if (!systemStatus?.speechRecognitionSupported) return;
    // Stop any TTS first
    try { sahabTTSV2.stop(); } catch (e) { }

    setIsProcessing(true);
    setIsListening(true);
    setTranscript('');
    setAiResponse('');
    setCurrentTask('در حال گوش دادن...');

    // Provide interim updates from recognition
    enhancedPersianSpeechRecognition.onInterim((text: string) => {
      setTranscript(text);
    });

    try {
      const final = await audioIntelligenceService.listenWithInterim((t) => setTranscript(t));
      setTranscript(final);

      // Use internal analyze/process functions via any cast (safe here)
      const command = (audioIntelligenceService as any).analyzeVoiceCommand(final);
      const response = await (audioIntelligenceService as any).processCommand(command);

      setAiResponse(response.text);
      const historyEntry = {
        timestamp: new Date().toLocaleString('fa-IR'),
        command: final,
        response: response.text,
        success: true
      };
      setCommandHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      await handleVoiceTimeSelection(final);
    } catch (error) {
      console.error('Push-to-talk error:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای تشخیص';
      setAiResponse(`خطا: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setIsListening(false);
      setCurrentTask('');
    }
  };

  const handlePushEnd = () => {
    try {
      enhancedPersianSpeechRecognition.stopListening();
    } catch (e) { }
  };

  // Handle voice-controlled time selection
  const handleVoiceTimeSelection = async (transcript: string) => {
    const timeKeywords = {
      'یک هفته': '1week',
      'هفته گذشته': '1week',
      'یک ماه': '1month',
      'ماه گذشته': '1month',
      'سه ماه': '3months',
      'سه ماه گذشته': '3months'
    };

    const analysisKeywords = {
      'تحلیل فروش': 'sales',
      'فروش': 'sales',
      'تحلیل بازخورد': 'feedback',
      'بازخورد': 'feedback',
      'نظرات': 'feedback',
      'تحلیل سودآوری': 'profitability',
      'سودآوری': 'profitability',
      'سود': 'profitability'
    };

    let selectedPeriod = '';
    let analysisType = '';

    // Find time period
    for (const [keyword, period] of Object.entries(timeKeywords)) {
      if (transcript.includes(keyword)) {
        selectedPeriod = period;
        break;
      }
    }

    // Find analysis type
    for (const [keyword, type] of Object.entries(analysisKeywords)) {
      if (transcript.includes(keyword)) {
        analysisType = type;
        break;
      }
    }

    // Execute analysis if both found
    if (selectedPeriod && analysisType) {
      setSelectedTimeRange(`${analysisType}-${selectedPeriod}`);

      if (analysisType === 'sales') {
        await handleSalesAnalysis(selectedPeriod);
      } else if (analysisType === 'feedback') {
        await handleFeedbackAnalysis(selectedPeriod);
      } else if (analysisType === 'profitability') {
        await handleProfitabilityAnalysis(selectedPeriod);
      }
    }
  };

  const stopAllAudio = () => {
    audioIntelligenceService.stopAudioProcessing();
    sahabTTSV2.stop();
    setIsProcessing(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTtsStatus(prev => ({ ...prev, isLoading: false, error: null }));
  };

  // Test advanced speech-to-text
  // Test Sahab speech recognition
  const testSahabSpeech = async () => {
    try {
      setCurrentTask('تست سیستم تشخیص گفتار ساهاب...');
      setIsProcessing(true);

      console.log('🎤 Testing Sahab speech recognition...');

      // Test if supported
      if (!sahabSpeechRecognition.isSupported()) {
        setAiResponse('سیستم ضبط در این مرورگر پشتیبانی نمی‌شود.');
        return;
      }

      setCurrentTask('شروع ضبط... (5 ثانیه صحبت کنید)');

      // Record and convert using Sahab API
      const result = await sahabSpeechRecognition.recordAndConvert(5000);

      setTranscript(result);
      setAiResponse(`✅ تست ساهاب موفق! متن تشخیص داده شده: "${result}"`);

    } catch (error) {
      console.error('خطا در تست ساهاب:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setAiResponse(`❌ خطا در تست ساهاب: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setCurrentTask('');
    }
  };

  // Test new Sahab TTS API
  const testSahabTTS = async () => {
    const testText = 'سلام! این یک تست سیستم صوتی جدید ساهاب است. کیفیت صدا بسیار عالی است.';
    const startTime = Date.now();

    // Add log entry
    const logEntry = {
      timestamp: new Date().toLocaleString('fa-IR'),
      text: testText,
      speaker: '3',
      status: 'loading' as const
    };
    setTtsLogs(prev => [logEntry, ...prev.slice(0, 9)]);

    setTtsStatus(prev => ({ ...prev, isLoading: true, error: null, currentService: 'sahab' }));

    try {
      await sahabTTSV2.speak(testText, {
        speaker: '3',
        onLoadingStart: () => {
          setTtsStatus(prev => ({ ...prev, isLoading: true }));
        },
        onLoadingEnd: () => {
          setTtsStatus(prev => ({ ...prev, isLoading: false }));
        },
        onError: (error) => {
          setTtsStatus(prev => ({ ...prev, error, isLoading: false }));
          // Update log
          setTtsLogs(prev => prev.map((log, index) =>
            index === 0 ? { ...log, status: 'error' as const, error, duration: Date.now() - startTime } : log
          ));
        }
      });

      // Update log on success
      setTtsLogs(prev => prev.map((log, index) =>
        index === 0 ? { ...log, status: 'success' as const, duration: Date.now() - startTime } : log
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setTtsStatus(prev => ({ ...prev, error: errorMessage, isLoading: false }));

      // Update log on error
      setTtsLogs(prev => prev.map((log, index) =>
        index === 0 ? { ...log, status: 'error' as const, error: errorMessage, duration: Date.now() - startTime } : log
      ));
    }
  };

  // Handle sales analysis based on selected time period
  const handleSalesAnalysis = async (period: string) => {
    if (isAnalyzingSales) return;

    setSalesPeriod(period);
    setIsAnalyzingSales(true);
    setSalesError('');
    setSalesAnalysis(null);

    try {
      // Calculate date range based on selected period
      const endDate = new Date().toISOString().split('T')[0];
      let startDate = '';

      if (period === '1week') {
        // 1 week ago
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (period === '1month') {
        // 1 month ago
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (period === '3months') {
        // 3 months ago
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      const response = await fetch('/api/voice-analysis/sales-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          period,
        }),
      });

      if (!response.ok) {
        throw new Error('خطا در تحلیل فروش');
      }

      const data = await response.json();
      setSalesAnalysis(data);
    } catch (error) {
      console.error('Error analyzing sales:', error);
      setSalesError('خطا در تحلیل فروش. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsAnalyzingSales(false);
    }
  };

  // Handle feedback analysis based on selected time period
  const handleFeedbackAnalysis = async (period: string) => {
    if (isAnalyzingFeedback) return;

    setFeedbackPeriod(period);
    setIsAnalyzingFeedback(true);
    setFeedbackError('');
    setFeedbackAnalysis(null);

    try {
      // Calculate date range based on selected period
      const endDate = new Date().toISOString().split('T')[0];
      let startDate = '';

      if (period === '1week') {
        // 1 week ago
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (period === '1month') {
        // 1 month ago
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (period === '3months') {
        // 3 months ago
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      const response = await fetch('/api/voice-analysis/feedback-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          period,
        }),
      });

      if (!response.ok) {
        throw new Error('خطا در تحلیل بازخوردها');
      }

      const data = await response.json();
      setFeedbackAnalysis(data);
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      setFeedbackError('خطا در تحلیل بازخوردها. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsAnalyzingFeedback(false);
    }
  };

  // Handle profitability analysis based on selected time period
  const handleProfitabilityAnalysis = async (period: string) => {
    if (isAnalyzingProfitability) return;

    setProfitabilityPeriod(period);
    setIsAnalyzingProfitability(true);
    setProfitabilityError('');
    setProfitabilityAnalysis(null);

    try {
      // Calculate date range based on selected period
      const endDate = new Date().toISOString().split('T')[0];
      let startDate = '';

      if (period === '1week') {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (period === '1month') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (period === '3months') {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      const response = await fetch('/api/voice-analysis/profitability-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          period,
        }),
      });

      if (!response.ok) {
        throw new Error('خطا در تحلیل سودآوری');
      }

      const data = await response.json();
      setProfitabilityAnalysis(data);
    } catch (error) {
      console.error('Error analyzing profitability:', error);
      setProfitabilityError('خطا در تحلیل سودآوری. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsAnalyzingProfitability(false);
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <span className="text-sm">ساهاب (اصلی):</span>
              <Badge variant={systemStatus?.sahabSpeechStatus?.isSupported ? "default" : "destructive"}>
                {systemStatus?.sahabSpeechStatus?.isSupported ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">در حال پردازش:</span>
              <Badge variant={systemStatus?.isProcessing || ttsStatus.isLoading || systemStatus?.sahabSpeechStatus?.isRecording ? "secondary" : "outline"}>
                {systemStatus?.isProcessing || ttsStatus.isLoading || systemStatus?.sahabSpeechStatus?.isRecording ? 'بله' : 'خیر'}
              </Badge>
            </div>
          </div>

          {/* Status Details */}
          {(ttsStatus.isLoading || ttsStatus.error || systemStatus?.sahabSpeechStatus?.isRecording) && (
            <div className="mt-4 p-3 rounded-lg border">
              {systemStatus?.sahabSpeechStatus?.isRecording && (
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Mic className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">در حال ضبط صدا با ساهاب...</span>
                </div>
              )}

              {ttsStatus.isLoading && (
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">در حال ارسال متن به سرویس صوتی...</span>
                </div>
              )}

              {ttsStatus.error && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">خطا در سرویس صوتی: {ttsStatus.error}</span>
                </div>
              )}
            </div>
          )}


        </CardContent>
      </Card>

      {/* Processing Progress */}
      {(isProcessing || currentTask) && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentTask || 'در حال پردازش...'}</span>
                {processingProgress > 0 && <span>{processingProgress}%</span>}
              </div>
              {processingProgress > 0 ? (
                <Progress value={processingProgress} className="w-full" />
              ) : (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
              {isListening && (
                <div className="flex items-center justify-center gap-2 text-green-600 mt-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-ping"></div>
                  <span className="text-sm">در حال ضبط...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              onMouseDown={() => handlePushStart()}
              onMouseUp={() => handlePushEnd()}
              onTouchStart={(e) => { e.preventDefault(); handlePushStart(); }}
              onTouchEnd={(e) => { e.preventDefault(); handlePushEnd(); }}
              disabled={!systemStatus?.speechRecognitionSupported || !systemStatus?.ttsSupported}
              className={`w-24 h-24 rounded-full transition-all duration-300 ${isProcessing
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
                  {isListening ? 'در حال ضبط صدا...' : isSpeaking ? 'در حال پخش پاسخ...' : 'در حال پردازش...'}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {isProcessing
                  ? isListening
                    ? 'برای توقف ضبط و پردازش کلیک کنید'
                    : 'در حال پردازش...'
                  : 'برای شروع ضبط صدا کلیک کنید'}
              </p>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3 mt-4">
              {/* Stop All Button */}
              {(isProcessing || isListening || isSpeaking || ttsStatus.isLoading) && (
                <Button
                  onClick={stopAllAudio}
                  variant="destructive"
                >
                  توقف اضطراری
                </Button>
              )}

              {/* Manual Stop Recording Button */}
              {isListening && (
                <Button
                  onClick={async () => {
                    try {
                      await audioIntelligenceService.stopCurrentRecording();
                    } catch (error) {
                      console.error('خطا در توقف ضبط:', error);
                    }
                  }}
                  variant="secondary"
                >
                  پایان ضبط و پردازش
                </Button>
              )}

              {/* Test Sahab TTS Button */}
              <Button
                onClick={testSahabTTS}
                variant="outline"
                disabled={ttsStatus.isLoading || isProcessing}
                className="flex items-center gap-2"
              >
                {ttsStatus.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                تست TTS
              </Button>

              {/* Test Sahab Speech Recognition Button */}
              <Button
                onClick={testSahabSpeech}
                variant="outline"
                disabled={isProcessing || systemStatus?.sahabSpeechStatus?.isRecording}
                className="flex items-center gap-2"
              >
                {systemStatus?.sahabSpeechStatus?.isRecording ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                تست ساهاب
              </Button>
            </div>
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

      {/* Voice Commands Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5" />
            راهنمای دستورات صوتی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                گزارشات همکاران:
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">گزارش خودم</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">گزارش کار احمد</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">گزارش علی</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">report sara</Badge>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                گزارشات تیم:
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">گزارشات امروز</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">همه گزارشات</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">کل گزارشات امروز</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">تمام گزارشات امروز</Badge>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                تحلیل فروش:
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">تحلیل فروش یک هفته</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">فروش ماه گذشته</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">آمار فروش سه ماه</Badge>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                تحلیل بازخوردها:
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">تحلیل بازخورد هفتگی</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">نظرات ماه گذشته</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">بازخورد سه ماه</Badge>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                تحلیل سودآوری:
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">تحلیل سودآوری هفتگی</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">سودآوری ماه گذشته</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">سود سه ماه</Badge>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            

            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                نحوه استفاده:
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• روی دکمه میکروفون کلیک کنید</li>
                <li>• شروع به صحبت کنید</li>
                <li>• دوباره کلیک کنید یا "پایان ضبط" را بزنید</li>
                <li>• صبر کنید تا متن استخراج شود</li>
                <li>• سیستم دستور را تشخیص داده و اجرا می‌کند</li>
                <li>• پاسخ به صورت صوتی پخش می‌شود</li>
              </ul>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                مثال‌های دستورات:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• "گزارش خودم" - گزارش همکار خودم</li>
                <li>• "گزارشات امروز" - همه گزارشات امروز</li>
                <li>• "تحلیل فروش یک ماه گذشته"</li>
                <li>• "بازخورد مشتریان هفته گذشته"</li>
                <li>• "تحلیل سودآوری سه ماه"</li>
                <li>• "گزارش کار احمد"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Analysis Results */}
      {(feedbackAnalysis || salesAnalysis || profitabilityAnalysis) && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              نتایج تحلیل صوتی
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Sales Analysis Results */}
            {salesAnalysis && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">تحلیل فروش</h3>
                  <Badge variant="secondary">{salesPeriod}</Badge>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">خلاصه تحلیل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 whitespace-pre-wrap">{salesAnalysis.summary}</p>
                  </CardContent>
                </Card>

                {salesAnalysis.sales_metrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">آمار کلیدی</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {salesAnalysis.sales_metrics.total_sales.toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-700">مجموع فروش (تومان)</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {salesAnalysis.sales_metrics.total_profit.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-700">سود خالص (تومان)</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {salesAnalysis.sales_metrics.order_count}
                          </div>
                          <div className="text-sm text-purple-700">تعداد سفارشات</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {salesAnalysis.sales_metrics.avg_order_value.toLocaleString()}
                          </div>
                          <div className="text-sm text-orange-700">میانگین سفارش (تومان)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Feedback Analysis Results */}
            {feedbackAnalysis && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">تحلیل بازخوردها</h3>
                  <Badge variant="secondary">{feedbackPeriod}</Badge>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">خلاصه تحلیل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 whitespace-pre-wrap">{feedbackAnalysis.summary}</p>
                  </CardContent>
                </Card>

                {feedbackAnalysis.sentiment_analysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">تحلیل احساسات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {feedbackAnalysis.sentiment_analysis.positive}%
                          </div>
                          <div className="text-sm text-green-700">مثبت</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {feedbackAnalysis.sentiment_analysis.neutral}%
                          </div>
                          <div className="text-sm text-yellow-700">خنثی</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {feedbackAnalysis.sentiment_analysis.negative}%
                          </div>
                          <div className="text-sm text-red-700">منفی</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {feedbackAnalysis.recommendations && feedbackAnalysis.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">پیشنهادات بهبود</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feedbackAnalysis.recommendations.map((recommendation: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Profitability Analysis Results */}
            {profitabilityAnalysis && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">تحلیل سودآوری</h3>
                  <Badge variant="secondary">{profitabilityPeriod}</Badge>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">خلاصه تحلیل</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 whitespace-pre-wrap">{profitabilityAnalysis.summary}</p>
                  </CardContent>
                </Card>

                {profitabilityAnalysis.profitability_metrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">شاخص‌های سودآوری</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-xl font-bold text-green-600">
                            {profitabilityAnalysis.profitability_metrics.total_revenue.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-700">درآمد کل (تومان)</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-xl font-bold text-red-600">
                            {profitabilityAnalysis.profitability_metrics.total_costs.toLocaleString()}
                          </div>
                          <div className="text-sm text-red-700">هزینه کل (تومان)</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">
                            {profitabilityAnalysis.profitability_metrics.net_profit.toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-700">سود خالص (تومان)</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-xl font-bold text-purple-600">
                            {profitabilityAnalysis.profitability_metrics.profit_margin}%
                          </div>
                          <div className="text-sm text-purple-700">حاشیه سود</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-xl font-bold text-orange-600">
                            {profitabilityAnalysis.profitability_metrics.roi}%
                          </div>
                          <div className="text-sm text-orange-700">بازده سرمایه</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {profitabilityAnalysis.cost_breakdown && profitabilityAnalysis.cost_breakdown.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">تفکیک هزینه‌ها</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {profitabilityAnalysis.cost_breakdown.map((cost: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{cost.category}</span>
                            <div className="text-right">
                              <div className="font-bold">{cost.amount.toLocaleString()} تومان</div>
                              <div className="text-sm text-gray-600">{cost.percentage}% از درآمد</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {profitabilityAnalysis.recommendations && profitabilityAnalysis.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">پیشنهادات بهبود سودآوری</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {profitabilityAnalysis.recommendations.map((recommendation: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TTS Request Logs */}
      {ttsLogs.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              لاگ درخواست‌های صوتی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ttsLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
                  <div className="flex-shrink-0 mt-1">
                    {log.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                    {log.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {log.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        صدای {log.speaker}
                      </span>
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                    </div>

                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {log.text.length > 100 ? log.text.substring(0, 100) + '...' : log.text}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                        {log.status === 'success' ? 'موفق' :
                          log.status === 'error' ? 'خطا' : 'در حال پردازش'}
                      </span>

                      {log.duration && (
                        <span>{log.duration}ms</span>
                      )}

                      {log.error && (
                        <span className="text-red-600 truncate max-w-xs">
                          {log.error}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {ttsLogs.length >= 10 && (
              <div className="mt-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTtsLogs([])}
                >
                  پاک کردن لاگ‌ها
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
