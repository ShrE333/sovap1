
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'student') {
            return NextResponse.json({ error: 'Only students can enroll' }, { status: 403 });
        }

        const { courseId } = await req.json();

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        // Check if course exists and is published
        const courses = await dbClient.getCourses({ status: 'published' });
        const course = courses.find((c: any) => c.id === courseId);

        if (!course) {
            return NextResponse.json({ error: 'Course not found or not available' }, { status: 404 });
        }

        // Check if already enrolled
        const enrollments = await dbClient.getEnrollments({ user_id: user.id, course_id: courseId });
        if (enrollments.length > 0) {
            return NextResponse.json({ message: 'Already enrolled', enrollment: enrollments[0] });
        }

        // Create enrollment
        const enrollment = await dbClient.createEnrollment({
            user_id: user.id,
            course_id: courseId
        });

        return NextResponse.json({ enrollment });

    } catch (error) {
        console.error('Enrollment error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
