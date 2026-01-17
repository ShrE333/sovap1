
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

        if (!user) {
            // Check if it's a configuration issue vs missing user
            const isMock = process.env.USE_MOCK_DATA !== 'false';
            return NextResponse.json(
                { error: 'Invalid credentials', debug: isMock ? 'Mock Mode' : 'Supabase Active' },
                { status: 401 }
            );
        }

        if (!user.is_active) {
            return NextResponse.json(
                { error: 'Account is inactive' },
                { status: 401 }
            );
        }

        // Authentication logic
        // 1. Check hardcoded admin fallback
        if (email === 'admin@sovap.in' && password === 'admin123') {
            // Master admin always allowed with this combo
        } else {
            // For all other users, check password hash (in this demo, we store it plain in DB)
            if (user.password_hash !== password) {
                return NextResponse.json(
                    { error: 'Invalid credentials', debug: 'Password Mismatch' },
                    { status: 401 }
                );
            }
        }

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
