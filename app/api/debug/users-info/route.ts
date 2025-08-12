import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET() {
    try {
        console.log('🔍 Getting users info for debugging...');

        // Get all users with their contact info
        const users = await executeQuery(`
            SELECT id, name, email, phone, role, created_at
            FROM users 
            ORDER BY created_at DESC
            LIMIT 10
        `);

        console.log('👥 Users found:', users?.length || 0);

        return NextResponse.json({
            success: true,
            data: users,
            message: `Found ${users?.length || 0} users`
        });

    } catch (error: any) {
        console.error('❌ Debug users info error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'خطا در دریافت اطلاعات کاربران'
        }, { status: 500 });
    }
}