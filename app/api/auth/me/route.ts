import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    // Try to get token from Authorization header first
    const authHeader = req.headers.get('authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // If no Authorization header, try to get from cookie
      token = req.cookies.get('auth-token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

      // Get user info from database
      const [user] = await executeQuery(`
        SELECT 
          id, name, email, role, phone, avatar,
          created_at, last_login, status
        FROM users 
        WHERE id = ? AND status = 'active'
      `, [decoded.id]);

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'کاربر یافت نشد' },
          { status: 404 }
        );
      }

      // Update last seen
      await executeQuery(`
        UPDATE users 
        SET last_login = NOW() 
        WHERE id = ?
      `, [user.id]);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          created_at: user.created_at,
          last_login: user.last_login,
          status: user.status
        }
      });

    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Get user info API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات کاربر' },
      { status: 500 }
    );
  }
}