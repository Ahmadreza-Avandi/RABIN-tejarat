'use client';

import React from 'react';
import { ResponsiveSidebar } from './sidebar';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

export const SimpleLayout: React.FC<SimpleLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <ResponsiveSidebar />

            {/* Main Content - با margin از سمت راست برای جای sidebar */}
            <main className="mr-0 lg:mr-72 transition-all duration-300 min-h-screen">
                <div className="p-4 lg:p-6 max-w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};