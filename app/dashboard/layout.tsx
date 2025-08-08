'use client';

import { ThemeProvider } from 'next-themes';
import { ResponsiveLayout } from '@/components/layout/responsive-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ResponsiveLayout>
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </ResponsiveLayout>
    </ThemeProvider>
  );
}