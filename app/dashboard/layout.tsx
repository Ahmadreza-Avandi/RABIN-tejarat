'use client';

import { SimpleLayout } from '@/components/layout/simple-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SimpleLayout>
      {children}
    </SimpleLayout>
  );
}