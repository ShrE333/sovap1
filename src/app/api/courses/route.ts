
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { dbClient } from '@/lib/db-client';

const createCourseSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
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

        // Check course limit for college
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
            estimated_hours: data.estimatedHours || 10,
            college_id: user.collegeId || null,
            teacher_id: user.id,
            status: 'published' // Make it visible to students immediately
        });

        // Trigger AI Course Generation Lab (FastAPI)
        // This is Phase 1-5 of the platform architecture
        const generatorUrl = process.env.GENERATOR_LAB_URL || 'http://localhost:8000';

        try {
            // We fire and forget (don't await) to keep API responsive
            fetch(`${generatorUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: course.title,
                    description: course.description,
                    modules_count: 5,
                    mcqs_per_module: 10
                })
            }).catch(e => console.error("Generator Lab Trigger Failed:", e));
        } catch (e) {
            console.error("Generator Linkage Failed:", e);
        }

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
            { error: error instanceof Error ? error.message : 'Internal server error' },
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
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
