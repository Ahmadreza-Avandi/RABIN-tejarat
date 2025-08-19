import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// POST /api/voice-analysis/feedback-analysis - Analyze feedback for a specific time period
export async function POST(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { startDate, endDate, period } = body;

        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, message: 'تاریخ شروع و پایان الزامی است' },
                { status: 400 }
            );
        }

        // Get feedback data from database for the specified period
        const feedbacks = await getFeedbackData(startDate, endDate);

        if (feedbacks.length === 0) {
            return NextResponse.json({
                success: true,
                summary: `در بازه زمانی انتخاب شده هیچ بازخوردی یافت نشد.`,
                sentiment_analysis: {
                    positive: 0,
                    neutral: 0,
                    negative: 0
                },
                key_themes: [],
                recommendations: ['بازخوردهای بیشتری از مشتریان جمع‌آوری کنید'],
                priority_issues: [],
                customer_satisfaction_trend: 'داده‌ای برای تحلیل روند موجود نیست.'
            });
        }

        // Prepare data for AI analysis
        const analysisData = {
            period: {
                start_date: startDate,
                end_date: endDate,
                period_name: getPeriodName(period)
            },
            feedbacks: feedbacks.map(feedback => ({
                type: feedback.type,
                title: feedback.title || '',
                comment: feedback.comment || '',
                score: feedback.score,
                sentiment: feedback.sentiment,
                category: feedback.category || '',
                priority: feedback.priority,
                channel: feedback.channel,
                customer_name: feedback.customer_name || 'ناشناس',
                customer_segment: feedback.customer_segment || 'نامشخص',
                created_at: feedback.created_at
            }))
        };

        // Create analysis prompt
        const analysisPrompt = createFeedbackAnalysisPrompt(analysisData);

        // Send to AI API
        try {
            const aiAnalysis = await sendToAI(analysisPrompt);
            
            // Calculate sentiment statistics
            const sentimentStats = calculateSentimentStats(feedbacks);
            
            return NextResponse.json({
                success: true,
                summary: aiAnalysis.summary,
                sentiment_analysis: sentimentStats,
                key_themes: aiAnalysis.key_themes,
                recommendations: aiAnalysis.recommendations,
                priority_issues: aiAnalysis.priority_issues,
                customer_satisfaction_trend: aiAnalysis.customer_satisfaction_trend
            });
            
        } catch (aiError) {
            console.error('AI API error:', aiError);
            
            // Fallback analysis if AI fails
            const fallbackAnalysis = generateFallbackAnalysis(feedbacks, analysisData.period);
            
            return NextResponse.json({
                success: true,
                ...fallbackAnalysis,
                ai_error: true
            });
        }

    } catch (error) {
        console.error('Voice feedback analysis API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در تحلیل بازخوردها' },
            { status: 500 }
        );
    }
}

// Get feedback data from database
async function getFeedbackData(startDate: string, endDate: string) {
    try {
        const feedbacks = await executeQuery(`
            SELECT 
                f.*,
                c.name as customer_name,
                c.segment as customer_segment
            FROM feedback f
            LEFT JOIN customers c ON f.customer_id = c.id
            WHERE f.created_at BETWEEN ? AND ?
            ORDER BY f.created_at DESC
        `, [startDate, endDate]);
        
        return feedbacks;
    } catch (error) {
        console.error('Error fetching feedback data:', error);
        throw new Error('خطا در دریافت اطلاعات بازخوردها');
    }
}

// Create prompt for AI analysis
function createFeedbackAnalysisPrompt(data: any): string {
    const feedbackTexts = data.feedbacks.map((f: any) =>
        `نوع: ${f.type}, عنوان: ${f.title || 'ندارد'}, نظر: ${f.comment || 'ندارد'}, امتیاز: ${f.score || 'ندارد'}, احساس: ${f.sentiment || 'ندارد'}, مشتری: ${f.customer_name}, بخش: ${f.customer_segment}`
    ).join('\n');

    return `
لطفاً بازخوردهای زیر را تحلیل کنید و نتیجه را به صورت JSON برگردانید:

دوره: ${data.period.period_name} (${data.period.start_date} تا ${data.period.end_date})

بازخوردها:
${feedbackTexts}

لطفاً پاسخ را دقیقاً به این فرمت JSON برگردانید:
{
  "summary": "خلاصه کلی از تحلیل بازخوردها",
  "key_themes": ["موضوع 1", "موضوع 2", "موضوع 3"],
  "recommendations": ["پیشنهاد 1", "پیشنهاد 2", "پیشنهاد 3"],
  "priority_issues": ["مسئله 1", "مسئله 2", "مسئله 3"],
  "customer_satisfaction_trend": "تحلیل روند رضایت مشتری"
}
`;
}

// Send prompt to AI service
async function sendToAI(prompt: string) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const encodedPrompt = encodeURIComponent(prompt);
        const aiResponse = await fetch(`https://mine-gpt-alpha.vercel.app/proxy?text=${encodedPrompt}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!aiResponse.ok) {
            throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiResult = await aiResponse.json();
        
        // Parse the AI response
        let parsedResponse;
        try {
            // Try to parse if it's a string
            if (typeof aiResult.answer === 'string') {
                parsedResponse = JSON.parse(aiResult.answer);
            } else if (typeof aiResult.response === 'string') {
                parsedResponse = JSON.parse(aiResult.response);
            } else if (typeof aiResult.text === 'string') {
                parsedResponse = JSON.parse(aiResult.text);
            } else if (typeof aiResult === 'string') {
                parsedResponse = JSON.parse(aiResult);
            } else {
                // If it's already an object
                parsedResponse = aiResult;
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            throw new Error('Invalid AI response format');
        }

        return {
            summary: parsedResponse.summary || 'تحلیل در دسترس نیست.',
            key_themes: parsedResponse.key_themes || [],
            recommendations: parsedResponse.recommendations || [],
            priority_issues: parsedResponse.priority_issues || [],
            customer_satisfaction_trend: parsedResponse.customer_satisfaction_trend || 'روند رضایت مشتری قابل تحلیل نیست.'
        };
    } catch (error) {
        console.error('AI service error:', error);
        throw error;
    }
}

// Calculate sentiment statistics
function calculateSentimentStats(feedbacks: any[]) {
    const total = feedbacks.length;
    if (total === 0) return { positive: 0, neutral: 0, negative: 0 };

    const positive = feedbacks.filter(f => f.sentiment === 'positive').length;
    const neutral = feedbacks.filter(f => f.sentiment === 'neutral').length;
    const negative = feedbacks.filter(f => f.sentiment === 'negative').length;

    return {
        positive: Math.round((positive / total) * 100),
        neutral: Math.round((neutral / total) * 100),
        negative: Math.round((negative / total) * 100)
    };
}

// Generate fallback analysis if AI fails
function generateFallbackAnalysis(feedbacks: any[], period: any) {
    const totalFeedbacks = feedbacks.length;
    const complaints = feedbacks.filter(f => f.type === 'complaint').length;
    const suggestions = feedbacks.filter(f => f.type === 'suggestion').length;
    const praises = feedbacks.filter(f => f.type === 'praise').length;

    // Extract key themes
    const themes = new Set<string>();
    feedbacks.forEach(f => {
        if (f.category) themes.add(f.category);
        if (f.type === 'complaint') themes.add('شکایات');
        if (f.type === 'suggestion') themes.add('پیشنهادات');
        if (f.type === 'praise') themes.add('تشکرات');
    });

    // Extract priority issues
    const highPriorityFeedbacks = feedbacks.filter(f =>
        f.priority === 'high' || f.sentiment === 'negative'
    );
    const issues = new Set<string>();
    highPriorityFeedbacks.forEach(f => {
        if (f.title) issues.add(f.title);
        if (f.category) issues.add(`مشکل در ${f.category}`);
    });

    // Generate recommendations
    const recommendations = [
        'بهبود سیستم پشتیبانی مشتریان',
        'ایجاد فرآیند پیگیری منظم بازخوردها',
        'آموزش تیم خدمات مشتریان',
        'بهینه‌سازی کانال‌های ارتباطی',
        'ایجاد سیستم پاداش برای بازخوردهای مثبت'
    ];

    if (complaints / totalFeedbacks > 0.3) {
        recommendations.unshift('اولویت فوری: کاهش شکایات مشتریان');
    }

    // Calculate average score
    const avgScore = feedbacks
        .filter(f => f.score)
        .reduce((sum, f) => sum + f.score, 0) / feedbacks.filter(f => f.score).length;

    let satisfactionTrend = 'امتیاز رضایت قابل محاسبه نیست زیرا داده‌های کافی موجود نیست.';
    if (!isNaN(avgScore)) {
        if (avgScore >= 4) {
            satisfactionTrend = `رضایت مشتریان در سطح عالی (${avgScore.toFixed(1)}/5) قرار دارد. روند کلی مثبت است.`;
        } else if (avgScore >= 3) {
            satisfactionTrend = `رضایت مشتریان در سطح متوسط (${avgScore.toFixed(1)}/5) است. نیاز به بهبود وجود دارد.`;
        } else {
            satisfactionTrend = `رضایت مشتریان در سطح پایین (${avgScore.toFixed(1)}/5) است. نیاز فوری به اقدامات اصلاحی.`;
        }
    }

    return {
        summary: `در بازه زمانی ${period.period_name} (${period.start_date} تا ${period.end_date})، ${totalFeedbacks} بازخورد دریافت شده است. از این تعداد ${complaints} شکایت، ${suggestions} پیشنهاد و ${praises} تشکر بوده است. تحلیل نشان می‌دهد که عمده بازخوردها در زمینه ${Array.from(themes)[0] || 'خدمات'} متمرکز شده‌اند.`,
        key_themes: Array.from(themes).slice(0, 8),
        recommendations: recommendations.slice(0, 5),
        priority_issues: Array.from(issues).slice(0, 3),
        customer_satisfaction_trend: satisfactionTrend,
        sentiment_analysis: calculateSentimentStats(feedbacks)
    };
}

// Get period name based on period code
function getPeriodName(period: string): string {
    switch (period) {
        case '1week':
            return 'یک هفته گذشته';
        case '1month':
            return 'یک ماه گذشته';
        case '3months':
            return 'سه ماه گذشته';
        default:
            return 'دوره انتخاب شده';
    }
}