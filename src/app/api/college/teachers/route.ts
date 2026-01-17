import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { db } from '@/lib/mock-db';

const createTeacherSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || (user.role !== 'college' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const data = createTeacherSchema.parse(body);

        // Determine college ID
        let collegeId = user.collegeId;
        if (user.role === 'admin' && body.collegeId) {
            collegeId = body.collegeId;
        }

        if (!collegeId) {
            return NextResponse.json(
                { error: 'College ID required' },
                { status: 400 }
            );
        }

        // Check if email exists
        if (db.users.find(u => u.email === data.email)) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            );
        }

        // Create teacher
        const teacher = {
            id: `teacher-${Date.now()}`,
            email: data.email,
            password_hash: 'mock_hash', // In real app, hash data.password
            name: data.name,
            role: 'teacher' as const,
            college_id: collegeId,
            is_active: true,
        };

        db.users.push(teacher);

        return NextResponse.json({
            teacher: {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                collegeId: teacher.college_id,
            },
            credentials: {
                email: data.email,
                password: data.password,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Create teacher error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Filter teachers
        let teachers = db.users.filter(u => u.role === 'teacher');

        // Filter by college for college admins
        if (user.role === 'college') {
            teachers = teachers.filter(t => t.college_id === user.collegeId);
        } else if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get course counts
        const teachersWithCounts = teachers.map(teacher => {
            const courseCount = db.courses.filter(c => c.teacher_id === teacher.id).length;
            return {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                courseCount,
                created_at: new Date().toISOString(), // Mock timestamp if missing
                last_login: null
            };
        });

        return NextResponse.json({ teachers: teachersWithCounts });
    } catch (error) {
        console.error('Get teachers error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
