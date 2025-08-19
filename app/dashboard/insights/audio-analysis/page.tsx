'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { audioIntelligenceService } from '@/lib/audio-intelligence-service';
import { Mic, MicOff, Volume2, VolumeX, Play, Square, Loader2, MessageCircle, BarChart3, TrendingUp, DollarSign, Calendar, Clock, Headphones, Settings, Activity, Users, Target, Zap } from 'lucide-react';

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
    continuousListening: false
  });

  // Voice commands history
  const [commandHistory, setCommandHistory] = useState<Array<{
    timestamp: string;
    command: string;
    response: string;
    success: boolean;
  }>>([]);

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
      setProcessingProgress(0);
      setCurrentTask('');
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
    setIsProcessing(false);
    setIsListening(false);
    setIsSpeaking(false);
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

      {/* Voice Commands Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5" />
            راهنمای دستورات صوتی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                گزارشات همکاران:
              </h3>
              <ul className="space-y-2 text-sm">
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
                  <Badge variant="outline" className="text-xs">سود ماه گذشته</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">سودآوری سه ماه</Badge>
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
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                نکات مهم:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• همه دستورات از طریق صدا ارسال می‌شوند</li>
                <li>• برای بهترین نتیجه، در محیط آرام صحبت کنید</li>
                <li>• پس از فشردن دکمه، کمی صبر کنید</li>
                <li>• می‌توانید فارسی یا انگلیسی صحبت کنید</li>
              </ul>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                مثال‌های کاربردی:
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• "تحلیل فروش یک ماه گذشته"</li>
                <li>• "بازخورد مشتریان هفته گذشته"</li>
                <li>• "تحلیل سودآوری سه ماه"</li>
                <li>• "گزارش کار محمد"</li>
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
    </div>
  );
}
