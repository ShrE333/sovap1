
import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth/middleware';
import { z } from 'zod';
import { dbClient } from '@/lib/db-client';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = loginSchema.parse(body);

        // Find user using unified client
        const user = await dbClient.findUserByEmail(email);

        if (!user || !user.is_active) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Authentication logic
        // 1. Check hardcoded admin
        if (email === 'admin@sovap.in' && password !== 'admin123') {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 2. For others, in this mock/development phase, we accept the password
        // In production, we use bcrypt.compare(password, user.password_hash)

        // Create JWT token
        const token = createToken({
            id: user.id,
            email: user.email,
            role: user.role,
            collegeId: user.college_id || undefined,
        });

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                collegeId: user.college_id,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
