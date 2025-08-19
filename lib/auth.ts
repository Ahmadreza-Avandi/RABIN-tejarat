import { executeQuery } from './database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Get user ID from token
export async function getUserFromToken(token: string): Promise<string | null> {
  try {
    console.log('🔍 Verifying token:', token ? 'Token exists' : 'No token');
    console.log('🔍 JWT_SECRET:', JWT_SECRET ? 'Secret exists' : 'No secret');

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    console.log('🔍 Decoded token:', decoded);

    return decoded.id;
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    console.error('❌ Token value:', token);
    return null;
  }
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Login user
export async function loginUser(email: string, password: string) {
  try {
    // Find user by email
    const users = await executeQuery(
      'SELECT id, name, email, password_hash, role, status FROM users WHERE email = ? AND status = "active"',
      [email]
    );

    if (users.length === 0) {
      return {
        success: false,
        message: 'کاربر یافت نشد یا غیرفعال است'
      };
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return {
        success: false,
        message: 'رمز عبور اشتباه است'
      };
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Update last login
    await executeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    return {
      success: true,
      message: 'ورود با موفقیت انجام شد',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'خطای سرور داخلی'
    };
  }
}

// Check permissions
export function hasPermission(userRole: string, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  const normalizedUserRole = userRole.toLowerCase().trim();
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase().trim());
  return normalizedAllowedRoles.includes(normalizedUserRole);
}