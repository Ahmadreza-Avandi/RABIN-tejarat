'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import moment from 'moment-jalaali';
import {
    Monitor,
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    MessageCircle,
    RefreshCw,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    ArrowUpIcon,
    ArrowDownIcon,
    MinusIcon
} from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface SystemStats {
    totalCustomers: number;
    totalSales: number;
    totalRevenue: number;
    totalFeedbacks: number;
    weeklyRevenue: any[];
    monthlyRevenue: any[];
    feedbackDistribution: any[];
    satisfactionData: any[];
    salesByStatus: any[];
    customersBySegment: any[];
    recentActivities: any[];
    growth: {
        customers: { percentage: number; trend: 'up' | 'down' | 'stable' };
        sales: { percentage: number; trend: 'up' | 'down' | 'stable' };
        revenue: { percentage: number; trend: 'up' | 'down' | 'stable' };
        feedback: { percentage: number; trend: 'up' | 'down' | 'stable' };
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function SystemMonitoringPage() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');

    useEffect(() => {
        fetchSystemStats();
        // Auto refresh every 5 minutes
        const interval = setInterval(fetchSystemStats, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchSystemStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/system/stats');
            const data = await response.json();

            if (data.success) {
                setStats(data.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Error fetching system stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchSystemStats();
    };

    const formatPersianDate = (date: Date) => {
        moment.loadPersian({ dialect: 'persian-modern' });
        return moment(date).format('jYYYY/jMM/jDD - HH:mm');
    };

    const formatPersianNumber = (num: number) => {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <ArrowUpIcon className="h-3 w-3" />;
            case 'down':
                return <ArrowDownIcon className="h-3 w-3" />;
            default:
                return <MinusIcon className="h-3 w-3" />;
        }
    };

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading && !stats) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">در حال بارگذاری آمار سیستم...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <Monitor className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">مانیتورینگ سیستم</h1>
                        <p className="text-muted-foreground mt-1">
                            آخرین بروزرسانی: {formatPersianDate(lastUpdated)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTimeRange(timeRange === 'weekly' ? 'monthly' : 'weekly')}
                        className="flex items-center gap-2"
                    >
                        <Calendar className="h-4 w-4" />
                        {timeRange === 'weekly' ? 'نمایش ماهانه' : 'نمایش هفتگی'}
                    </Button>
                    <Button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        بروزرسانی
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">کل مشتریان</CardTitle>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                            {formatPersianNumber(stats?.totalCustomers || 0)}
                        </div>
                        <div className="flex items-center gap-1">
                            <Badge
                                variant="secondary"
                                className={`${getTrendColor(stats?.growth.customers.trend || 'stable')} bg-transparent border-0 p-0`}
                            >
                                {getTrendIcon(stats?.growth.customers.trend || 'stable')}
                                {formatPersianNumber(stats?.growth.customers.percentage || 0)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">نسبت به ماه قبل</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">کل فروش</CardTitle>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                            {formatPersianNumber(stats?.totalSales || 0)}
                        </div>
                        <div className="flex items-center gap-1">
                            <Badge
                                variant="secondary"
                                className={`${getTrendColor(stats?.growth.sales.trend || 'stable')} bg-transparent border-0 p-0`}
                            >
                                {getTrendIcon(stats?.growth.sales.trend || 'stable')}
                                {formatPersianNumber(stats?.growth.sales.percentage || 0)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">نسبت به ماه قبل</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">درآمد کل</CardTitle>
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                            {new Intl.NumberFormat('fa-IR').format(stats?.totalRevenue || 0)} تومان
                        </div>
                        <div className="flex items-center gap-1">
                            <Badge
                                variant="secondary"
                                className={`${getTrendColor(stats?.growth.revenue.trend || 'stable')} bg-transparent border-0 p-0`}
                            >
                                {getTrendIcon(stats?.growth.revenue.trend || 'stable')}
                                {formatPersianNumber(stats?.growth.revenue.percentage || 0)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">نسبت به ماه قبل</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">کل بازخوردها</CardTitle>
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <MessageCircle className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                            {formatPersianNumber(stats?.totalFeedbacks || 0)}
                        </div>
                        <div className="flex items-center gap-1">
                            <Badge
                                variant="secondary"
                                className={`${getTrendColor(stats?.growth.feedback.trend || 'stable')} bg-transparent border-0 p-0`}
                            >
                                {getTrendIcon(stats?.growth.feedback.trend || 'stable')}
                                {formatPersianNumber(stats?.growth.feedback.percentage || 0)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">نسبت به ماه قبل</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            درآمد {timeRange === 'weekly' ? 'هفتگی' : 'ماهانه'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={timeRange === 'weekly' ? stats?.weeklyRevenue : stats?.monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    axisLine={{ stroke: '#e0e0e0' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    axisLine={{ stroke: '#e0e0e0' }}
                                />
                                <Tooltip
                                    formatter={(value) => [new Intl.NumberFormat('fa-IR').format(Number(value)) + ' تومان', 'درآمد']}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Feedback Distribution */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-green-600" />
                            توزیع بازخوردها
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <RechartsPieChart>
                                <Pie
                                    data={stats?.feedbackDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stats?.feedbackDistribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Satisfaction Trend */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-purple-600" />
                            روند رضایت مشتری
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={stats?.satisfactionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    axisLine={{ stroke: '#e0e0e0' }}
                                />
                                <YAxis
                                    domain={[0, 5]}
                                    tick={{ fontSize: 12 }}
                                    axisLine={{ stroke: '#e0e0e0' }}
                                />
                                <Tooltip
                                    formatter={(value) => [Number(value).toFixed(1), 'امتیاز رضایت']}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="satisfaction"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.3}
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sales by Status */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                            فروش بر اساس وضعیت
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <RechartsPieChart>
                                <Pie
                                    data={stats?.salesByStatus}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stats?.salesByStatus?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activities */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        فعالیت‌های اخیر سیستم
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                            stats.recentActivities.map((activity, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                        <span className="font-medium text-gray-900">{activity.description}</span>
                                    </div>
                                    <Badge variant="outline" className="text-gray-600 border-gray-300">
                                        {activity.time}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-12">
                                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">هیچ فعالیت اخیری یافت نشد</p>
                                <p className="text-sm">فعالیت‌های جدید اینجا نمایش داده خواهند شد</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}