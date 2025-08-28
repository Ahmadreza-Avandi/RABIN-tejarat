// Authentication Helper for API Routes
import { NextRequest } from 'next/server';

export interface AuthUser {
    id: string;
    email: string;
    role: string;
}

// Simple JWT decoder (Edge Runtime compatible)
function decodeJWT(token: string): AuthUser | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];
        // Add padding if needed
        let paddedPayload = payload;
        while (paddedPayload.length % 4) {
            paddedPayload += '=';
        }

        const decoded = JSON.parse(atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/')));

        // Check expiration
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            console.log('Token expired:', decoded.exp, 'vs', Date.now() / 1000);
            return null;
        }

        if (!decoded.id || !decoded.email || !decoded.role) {
            console.log('Missing required fields in token:', decoded);
            return null;
        }

        return {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
    } catch (error) {
        console.error('JWT decode error:', error);
        return null;
    }
}

// Get authenticated user from request
export function getAuthUser(req: NextRequest): AuthUser | null {
    // Always try to get user from token directly since middleware might skip some routes
    const token = req.cookies.get('auth-token')?.value ||
        req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
        return null;
    }

    const user = decodeJWT(token);
    if (user) {
        return user;
    }

    // Fallback: Try to get user from middleware headers
    const userIdFromMiddleware = req.headers.get('x-user-id');
    const userEmailFromMiddleware = req.headers.get('x-user-email');
    const userRoleFromMiddleware = req.headers.get('x-user-role');

    if (userIdFromMiddleware && userEmailFromMiddleware && userRoleFromMiddleware) {
        return {
            id: userIdFromMiddleware,
            email: userEmailFromMiddleware,
            role: userRoleFromMiddleware
        };
    }

    return null;
}

// Check if user has required role
export function hasRole(user: AuthUser | null, requiredRole: string): boolean {
    if (!user) return false;

    const roleHierarchy = {
        'admin': 4,
        'ceo': 3,
        'manager': 2,
        'employee': 1
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
}

// Standard authentication response
export const authErrorResponse = {
    unauthorized: {
        success: false,
        message: 'غیر مجاز - لطفاً وارد شوید'
    },
    invalidToken: {
        success: false,
        message: 'توکن نامعتبر'
    },
    insufficientRole: {
        success: false,
        message: 'دسترسی کافی ندارید'
    }
};