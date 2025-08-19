import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// POST /api/voice-analysis/sales-analysis - Analyze sales data for a specific time period
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

        // Get sales data from database for the specified period
        const salesData = await getSalesData(startDate, endDate);

        if (!salesData || salesData.length === 0) {
            return NextResponse.json({
                success: true,
                summary: `در بازه زمانی انتخاب شده هیچ داده فروشی یافت نشد.`,
                sales_metrics: {
                    total_sales: 0,
                    total_profit: 0,
                    order_count: 0,
                    avg_order_value: 0
                },
                top_products: [],
                recommendations: ['برای تحلیل دقیق‌تر، داده‌های فروش بیشتری ثبت کنید'],
                sales_trend: 'داده‌ای برای تحلیل روند فروش موجود نیست.'
            });
        }

        // Calculate sales metrics
        const salesMetrics = calculateSalesMetrics(salesData);

        // Get top products
        const topProducts = await getTopProducts(startDate, endDate);

        // Prepare data for AI analysis
        const analysisData = {
            period: {
                start_date: startDate,
                end_date: endDate,
                period_name: getPeriodName(period)
            },
            sales: salesData,
            metrics: salesMetrics,
            top_products: topProducts
        };

        // Create analysis prompt
        const analysisPrompt = createSalesAnalysisPrompt(analysisData);

        // Send to AI API
        try {
            const aiAnalysis = await sendToAI(analysisPrompt);

            return NextResponse.json({
                success: true,
                summary: aiAnalysis.summary,
                sales_metrics: salesMetrics,
                top_products: topProducts,
                recommendations: aiAnalysis.recommendations,
                sales_trend: aiAnalysis.sales_trend
            });

        } catch (aiError) {
            console.error('AI API error:', aiError);

            // Fallback analysis if AI fails
            const fallbackAnalysis = generateFallbackAnalysis(salesData, analysisData.period, salesMetrics, topProducts);

            return NextResponse.json({
                success: true,
                ...fallbackAnalysis,
                ai_error: true
            });
        }

    } catch (error) {
        console.error('Voice sales analysis API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در تحلیل فروش' },
            { status: 500 }
        );
    }
}

// Get sales data from database
async function getSalesData(startDate: string, endDate: string) {
    try {
        const sales = await executeQuery(`
            SELECT 
                s.*,
                c.name as customer_name,
                c.segment as customer_segment,
                s.sales_person_name as sales_rep_name
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.sale_date BETWEEN ? AND ?
            ORDER BY s.sale_date DESC
        `, [startDate, endDate]);

        return sales;
    } catch (error) {
        console.error('Error fetching sales data:', error);
        throw new Error('خطا در دریافت اطلاعات فروش');
    }
}

// Get top products for the period
async function getTopProducts(startDate: string, endDate: string) {
    try {
        const products = await executeQuery(`
            SELECT 
                p.id,
                p.name,
                COUNT(si.id) as sales_count,
                SUM(si.quantity) as total_quantity,
                SUM(si.price * si.quantity) as total_revenue
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE s.sale_date BETWEEN ? AND ?
            GROUP BY p.id, p.name
            ORDER BY sales_count DESC
            LIMIT 5
        `, [startDate, endDate]);

        return products;
    } catch (error) {
        console.error('Error fetching top products:', error);
        return [];
    }
}

// Calculate sales metrics
function calculateSalesMetrics(salesData: any[]) {
    const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
    const totalProfit = salesData.reduce((sum, sale) => sum + (parseFloat(sale.profit) || 0), 0);
    const orderCount = salesData.length;
    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

    return {
        total_sales: Math.round(totalSales),
        total_profit: Math.round(totalProfit),
        order_count: orderCount,
        avg_order_value: Math.round(avgOrderValue)
    };
}

// Create prompt for AI analysis
function createSalesAnalysisPrompt(data: any): string {
    const salesSummary = `
دوره: ${data.period.period_name} (${data.period.start_date} تا ${data.period.end_date})
تعداد فروش: ${data.sales.length}
مجموع فروش: ${data.metrics.total_sales.toLocaleString()} تومان
سود خالص: ${data.metrics.total_profit.toLocaleString()} تومان
میانگین سفارش: ${data.metrics.avg_order_value.toLocaleString()} تومان

محصولات پرفروش:
${data.top_products.map((p: any, i: number) => `${i + 1}. ${p.name}: ${p.sales_count} فروش (${p.total_quantity} عدد)`).join('\n')}
`;

    return `
لطفاً داده‌های فروش زیر را تحلیل کنید و نتیجه را به صورت JSON برگردانید:

${salesSummary}

لطفاً پاسخ را دقیقاً به این فرمت JSON برگردانید:
{
  "summary": "خلاصه کلی از تحلیل فروش",
  "recommendations": ["پیشنهاد 1", "پیشنهاد 2", "پیشنهاد 3"],
  "sales_trend": "تحلیل روند فروش"
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
            recommendations: parsedResponse.recommendations || [],
            sales_trend: parsedResponse.sales_trend || 'روند فروش قابل تحلیل نیست.'
        };
    } catch (error) {
        console.error('AI service error:', error);
        throw error;
    }
}

// Generate fallback analysis if AI fails
function generateFallbackAnalysis(salesData: any[], period: any, metrics: any, topProducts: any[]) {
    const totalSales = metrics.total_sales;
    const totalProfit = metrics.total_profit;
    const orderCount = metrics.order_count;
    const avgOrderValue = metrics.avg_order_value;

    // Generate recommendations based on data
    const recommendations = [];

    if (topProducts.length > 0) {
        recommendations.push(`تمرکز بیشتر بر فروش محصول "${topProducts[0].name}" که پرفروش‌ترین محصول است.`);
    }

    if (avgOrderValue < 1000000) {
        recommendations.push('افزایش میانگین ارزش سفارش با پیشنهاد محصولات مکمل به مشتریان');
    }

    recommendations.push('بررسی الگوهای فصلی فروش برای برنامه‌ریزی بهتر موجودی');
    recommendations.push('ایجاد کمپین‌های بازاریابی هدفمند برای محصولات کم‌فروش');

    // Generate sales trend analysis
    let salesTrend = '';
    if (orderCount > 10) {
        salesTrend = `در دوره ${period.period_name}، مجموعاً ${orderCount} فروش با ارزش کلی ${totalSales.toLocaleString()} تومان ثبت شده است. میانگین ارزش هر سفارش ${avgOrderValue.toLocaleString()} تومان بوده است.`;
    } else if (orderCount > 0) {
        salesTrend = `تعداد فروش در این دوره کم بوده (${orderCount} مورد) و برای تحلیل دقیق‌تر نیاز به داده‌های بیشتری است.`;
    } else {
        salesTrend = 'در این دوره هیچ فروشی ثبت نشده است.';
    }

    return {
        summary: `در بازه زمانی ${period.period_name} (${period.start_date} تا ${period.end_date})، مجموعاً ${orderCount} فروش با ارزش کلی ${totalSales.toLocaleString()} تومان ثبت شده است. سود خالص این دوره ${totalProfit.toLocaleString()} تومان بوده است.`,
        sales_metrics: metrics,
        top_products: topProducts,
        recommendations: recommendations,
        sales_trend: salesTrend
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
