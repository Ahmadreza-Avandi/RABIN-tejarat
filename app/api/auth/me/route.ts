import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت یافت نشد' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

      // Get user info from database
      const [user] = await executeQuery(`
        SELECT 
          id, name, email, role, phone, avatar,
          created_at, last_login, is_active
        FROM users 
        WHERE id = ? AND is_active = 1
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
          is_active: user.is_active
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