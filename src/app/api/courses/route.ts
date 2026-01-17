
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { dbClient } from '@/lib/db-client';

const createCourseSchema = z.object({
    title: z.string().min(3),
    description: z.string(),
    modules: z.array(z.any()),
    estimatedHours: z.number().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const data = createCourseSchema.parse(body);

        // Check course limit for college (simplified: in mock/real we can fetch college)
        const colleges = await dbClient.getColleges();
        const college = colleges.find((c: any) => c.id === user.collegeId);

        if (college && (college.coursesCount || 0) >= college.courses_limit) {
            return NextResponse.json(
                { error: 'Course limit reached for your college' },
                { status: 400 }
            );
        }

        const course = await dbClient.createCourse({
            title: data.title,
            description: data.description,
            modules: data.modules,
            estimated_hours: data.estimatedHours || 0,
            college_id: user.collegeId!,
            teacher_id: user.id
        });

        return NextResponse.json({ course });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Create course error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const filters: any = {};
        if (status) filters.status = status;

        if (!user) {
            filters.status = 'published';
        } else if (user.role === 'student') {
            filters.status = 'published';
        } else if (user.role === 'teacher') {
            filters.teacher_id = user.id;
        } else if (user.role === 'college') {
            filters.college_id = user.collegeId;
        }

        const courses = await dbClient.getCourses(filters);

        return NextResponse.json({ courses });
    } catch (error) {
        console.error('Get courses error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
