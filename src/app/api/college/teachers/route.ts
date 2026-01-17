
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { dbClient } from '@/lib/db-client';

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
        const existingUser = await dbClient.findUserByEmail(data.email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            );
        }

        // Create teacher
        const teacher = await dbClient.createUser({
            email: data.email,
            password_hash: data.password, // Mock
            name: data.name,
            role: 'teacher',
            college_id: collegeId,
        });

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

        const filters: any = { role: 'teacher' };
        if (user.role === 'college') {
            filters.college_id = user.collegeId;
        } else if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const teachers = await dbClient.getUsers(filters);

        // Enhance with counts (In a real app, this would be a more efficient query)
        const teachersWithCounts = await Promise.all(teachers.map(async (teacher: any) => {
            const teacherCourses = await dbClient.getCourses({ teacher_id: teacher.id });
            return {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                courseCount: teacherCourses.length,
                created_at: teacher.created_at || new Date().toISOString(),
                last_login: null
            };
        }));

        return NextResponse.json({ teachers: teachersWithCounts });
    } catch (error) {
        console.error('Get teachers error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
