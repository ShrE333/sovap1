import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/mock-db';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'student') {
            // Only students can enroll (or maybe admins for them? stick to students for now)
            return NextResponse.json({ error: 'Only students can enroll' }, { status: 403 });
        }

        const { courseId } = await req.json();

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        // Check if course exists and is published
        const course = db.courses.find(c => c.id === courseId);
        if (!course || course.status !== 'published') {
            return NextResponse.json({ error: 'Course not found or not available' }, { status: 404 });
        }

        // Check if already enrolled
        const existing = db.enrollments.find(e => e.user_id === user.id && e.course_id === courseId);
        if (existing) {
            return NextResponse.json({ message: 'Already enrolled', enrollment: existing });
        }

        // Create enrollment
        const enrollment = {
            id: `enroll-${Date.now()}`,
            user_id: user.id,
            course_id: courseId,
            progress: 0,
            status: 'active' as const,
            created_at: new Date().toISOString()
        };

        db.enrollments.push(enrollment);

        return NextResponse.json({ enrollment });

    } catch (error) {
        console.error('Enrollment error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
