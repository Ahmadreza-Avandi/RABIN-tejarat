'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmailTestPage() {
    const [formData, setFormData] = useState({
        to: 'only.link086@gmail.com',
        subject: '🧪 تست فرانت‌اند - متن دلخواه',
        message: `سلام!

این یک تست کامل فرانت‌اند است.

متن دلخواه من اینجا نوشته شده و باید برسه!

اگر این ایمیل را دریافت کردید، یعنی:
✅ فرانت‌اند درست کار می‌کند
✅ API درست کار می‌کند  
✅ Gmail API متصل است
✅ ارسال ایمیل موفق است
✅ مشکل authentication حل شده

با تشکر`
    });

    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setResult(null);

        try {
            console.log('📤 ارسال درخواست:', formData);

            const response = await fetch('/api/test-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    type: 'simple'
                })
            });

            const data = await response.json();

            console.log('📊 Response Status:', response.status);
            console.log('📊 Response Data:', data);

            setResult({
                status: response.status,
                data: data
            });

        } catch (error: any) {
            console.error('❌ خطا:', error);
            setResult({
                status: 'ERROR',
                data: { error: error.message }
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto p-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">🧪 تست کامل فرانت‌اند ایمیل</CardTitle>
                        <p className="text-center text-gray-600">
                            این صفحه برای تست مشکل "متن دلخواه نمی‌رسه" ساخته شده
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    گیرنده:
                                </label>
                                <Input
                                    type="email"
                                    value={formData.to}
                                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    موضوع:
                                </label>
                                <Input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    متن دلخواه (این متن باید برسه!):
                                </label>
                                <Textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    rows={12}
                                    required
                                    className="font-mono"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={sending}
                                className="w-full"
                            >
                                {sending ? 'در حال ارسال...' : '📧 ارسال ایمیل تست'}
                            </Button>
                        </form>

                        {result && (
                            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                                <h3 className="font-bold mb-2">نتیجه تست:</h3>
                                <div className="text-sm">
                                    <div className={`p-2 rounded mb-2 ${result.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        <strong>Status:</strong> {result.status}
                                    </div>

                                    {result.data.success && (
                                        <div className="p-2 bg-green-100 text-green-800 rounded mb-2">
                                            ✅ ایمیل با موفقیت ارسال شد!<br />
                                            Message ID: {result.data.messageId}
                                        </div>
                                    )}

                                    {result.data.error && (
                                        <div className="p-2 bg-red-100 text-red-800 rounded mb-2">
                                            ❌ خطا: {result.data.error}
                                        </div>
                                    )}

                                    <div className="mt-2">
                                        <strong>Response کامل:</strong>
                                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                                            {JSON.stringify(result.data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-bold text-blue-800 mb-2">📋 راهنمای تست:</h4>
                            <ol className="text-sm text-blue-700 space-y-1">
                                <li>1. متن دلخواه خود را در فیلد بالا بنویسید</li>
                                <li>2. روی "ارسال ایمیل تست" کلیک کنید</li>
                                <li>3. منتظر بمانید تا نتیجه نمایش داده شود</li>
                                <li>4. ایمیل خود را چک کنید</li>
                                <li>5. اگر متن دلخواه رسید، مشکل حل شده! 🎉</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}