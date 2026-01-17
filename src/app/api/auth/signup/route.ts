
import { NextRequest, NextResponse } from 'next/server';
import { dbClient } from '@/lib/db-client';
import { createToken } from '@/lib/auth/middleware';
import { z } from 'zod';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.enum(['student', 'teacher']).default('student'),
    college_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = signupSchema.parse(body);

        // Check if user already exists
        const existingUser = await dbClient.findUserByEmail(data.email);
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Create user
        const newUser = await dbClient.createUser({
            email: data.email,
            name: data.name,
            password_hash: data.password, // Plain for now as per project convention so far
            role: data.role,
            college_id: data.college_id || null,
            is_active: true
        });

        // Generate token
        const token = createToken({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            collegeId: newUser.college_id || undefined,
        });

        return NextResponse.json({
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                college_id: newUser.college_id
            },
            token
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
        }
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
