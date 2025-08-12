'use client';

import { ResponsiveLayout } from '@/components/layout/responsive-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResponsiveLayout>
      <main className="flex-1 p-4 overflow-auto">
        {children}
      </main>
    </ResponsiveLayout>
  );
}