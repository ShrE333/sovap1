
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { dbClient } from '@/lib/db-client';

const createCourseSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    modules: z.array(z.any()),
    estimatedHours: z.number().optional(),
    modules_count: z.number().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || (user.role !== 'teacher' && user.role !== 'college' && user.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const data = createCourseSchema.parse(body);

        // Check course limit for college (skip for admin maybe? No, let's keep it)
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
            description: data.description || `AI-generated course specializing in ${data.title}. Full curriculum and assessments included.`,
            modules: data.modules,
            college_id: user.collegeId || null,
            teacher_id: user.id,
            status: 'published'
        });

        // Trigger AI Course Generation Lab
        const generatorUrl = process.env.GENERATOR_LAB_URL || 'http://localhost:8000';

        try {
            fetch(`${generatorUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: course.id,
                    title: course.title,
                    description: course.description,
                    modules_count: data.modules_count || 5, // Use schema value if exists
                    mcqs_per_module: 10
                })
            }).catch(e => console.error("Generator Lab Trigger Failed:", e));
        } catch (e) {
            console.error("Generator Linkage Failed:", e);
        }

        return NextResponse.json({ course });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
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
            // Student visibility is handled by dynamic logic below, no college_id filter here
        } else if (user.role === 'teacher' || user.role === 'college') {
            filters.college_id = user.collegeId;
        }

        let courses = await dbClient.getCourses(filters);

        // Apply dynamic visibility logic
        if (user && user.role === 'student') {
            // Students can only see:
            // 1. Courses created by 'college' admin (Public)
            // 2. Courses they are ALREADY enrolled in
            const enrollmentsRes = await dbClient.getEnrollments({ user_id: user.id });
            const enrolledIds = new Set(enrollmentsRes.map((e: any) => e.course_id));

            courses = courses.filter((c: any) =>
                c.creatorRole === 'college' || enrolledIds.has(c.id)
            );
        }

        return NextResponse.json({ courses });
    } catch (error) {
        console.error('Get courses error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
