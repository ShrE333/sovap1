import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { z } from 'zod';
import { db } from '@/lib/mock-db';

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

        // Check course limit for college
        const college = db.colleges.find(c => c.id === user.collegeId);
        const currentCourses = db.courses.filter(c =>
            c.college_id === user.collegeId &&
            (c.status === 'approved' || c.status === 'published')
        ).length;

        if (college && currentCourses >= college.courses_limit) {
            return NextResponse.json(
                { error: 'Course limit reached for your college' },
                { status: 400 }
            );
        }

        // Create course
        const course = {
            id: `course-${Date.now()}`,
            title: data.title,
            description: data.description,
            modules: data.modules, // In real app, simplify or store ref
            estimated_hours: data.estimatedHours || 0,
            college_id: user.collegeId!,
            teacher_id: user.id,
            status: 'pending_approval' as const,
            created_at: new Date().toISOString(),
        };

        db.courses.push(course);

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
        // Remove strict auth check for GET to allow public course listing
        // if (!user) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let courses = db.courses;

        // Filter based on role or public access
        if (!user) {
            // Public: Only published
            courses = courses.filter(c => c.status === 'published');
        } else if (user.role === 'student') {
            courses = courses.filter(c => c.status === 'published');
        } else if (user.role === 'teacher') {
            courses = courses.filter(c => c.teacher_id === user.id);
        } else if (user.role === 'college') {
            courses = courses.filter(c => c.college_id === user.collegeId);
        }

        if (status) {
            courses = courses.filter(c => c.status === status);
        }

        // Enhance response with teacher name (simplified join)
        const enhancedCourses = courses.map(c => {
            const teacher = db.users.find(u => u.id === c.teacher_id);
            return {
                ...c,
                author: teacher ? teacher.name : 'Unknown Driver', // Using "Driver" term or Name
                teacherName: teacher ? teacher.name : 'Unknown'
            };
        });

        return NextResponse.json({ courses: enhancedCourses });
    } catch (error) {
        console.error('Get courses error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
