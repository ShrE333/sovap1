import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
    id: string;
    email: string;
    role: 'admin' | 'college' | 'teacher' | 'student';
    collegeId?: string;
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch (error) {
        return null;
    }
}

export function requireAuth(allowedRoles?: string[]) {
    return async (req: NextRequest) => {
        const user = await verifyAuth(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return user;
    };
}

export function createToken(user: AuthUser): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}
