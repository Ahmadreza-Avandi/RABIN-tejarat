'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function TestEmailPage() {
    const [formData, setFormData] = useState({
        to: 'only.link086@gmail.com',
        subject: 'تست فرانت‌اند - ایمیل دلخواه',
        message: `سلام!

این یک تست فرانت‌اند است. 

اگر این ایمیل را دریافت کردید، یعنی:
✅ فرانت‌اند درست کار می‌کند
✅ API درست کار می‌کند  
✅ Gmail API متصل است
✅ ارسال ایمیل موفق است

متن دلخواه من اینجا نوشته شده و باید برسه!

با تشکر`
    });

    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { toast } = useToast();

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

            if (data.success) {
                toast({
                    title: "موفق",
                    description: `ایمیل ارسال شد - Message ID: ${data.messageId}`,
                });
            } else {
                toast({
                    title: "خطا",
                    description: data.error || "خطا در ارسال ایمیل",
                    variant: "destructive"
                });
            }

        } catch (error: any) {
            console.error('❌ خطا:', error);
            setResult({
                status: 'ERROR',
                data: { error: error.message }
            });

            toast({
                title: "خطا",
                description: "خطا در ارسال درخواست",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>🧪 تست فرانت‌اند ایمیل</CardTitle>
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
                                پیام:
                            </label>
                            <Textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={10}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={sending}
                            className="w-full"
                        >
                            {sending ? 'در حال ارسال...' : 'ارسال ایمیل'}
                        </Button>
                    </form>

                    {result && (
                        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                            <h3 className="font-bold mb-2">نتیجه:</h3>
                            <div className="text-sm">
                                <div><strong>Status:</strong> {result.status}</div>
                                <div className="mt-2">
                                    <strong>Response:</strong>
                                    <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                                        {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}