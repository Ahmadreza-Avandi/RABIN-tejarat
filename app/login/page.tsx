'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const currentYear = new Date().getFullYear();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Set cookie and redirect
                const isSecure = window.location.protocol === 'https:';
                document.cookie = `auth-token=${data.token}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;

                // Force reload to ensure cookie is set
                window.location.href = '/dashboard';
            } else {
                setError(data.message || 'خطا در ورود به سیستم');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('خطا در اتصال به سرور');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
            <div className="w-full max-w-[400px] px-4">
                <div className="mb-8 text-center">
                    <div className="w-[180px] h-[180px] mx-auto mb-4 relative">
                        <Image
                            src="https://uploadkon.ir/uploads/5c1f19_25x-removebg-preview.png"
                            alt="رابین تجارت"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-3xl font-bold font-vazir bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        رابین تجارت
                    </h1>
                    <p className="text-muted-foreground mt-2 font-vazir">
                        شرکت رابین تجارت خاورمیانه
                    </p>
                </div>

                <div>
                    <Card className="border-border/50 backdrop-blur-sm bg-background/95">
                        <CardContent className="pt-6">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="font-vazir">ایمیل</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ایمیل خود را وارد کنید"
                                        required
                                        className="font-vazir"
                                        dir="rtl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="font-vazir">رمز عبور</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="رمز عبور خود را وارد کنید"
                                        required
                                        className="font-vazir"
                                        dir="rtl"
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm text-center font-vazir">
                                        {error}
                                    </p>
                                )}

                                <div>
                                    <Button
                                        type="submit"
                                        className="w-full font-vazir"
                                        disabled={isLoggingIn}
                                    >
                                        {isLoggingIn ? 'در حال ورود...' : 'ورود به سیستم'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4 font-vazir">
                    توسعه داده شده توسط رابین تجارت &copy; {currentYear}
                </p>
            </div>
        </div>
    );
}