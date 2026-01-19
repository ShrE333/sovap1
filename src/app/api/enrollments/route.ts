
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
        }

        const role = user.role?.toLowerCase();
        if (role !== 'student' && role !== 'teacher') {
            return NextResponse.json({ error: 'Only students and teachers can enroll in courses.' }, { status: 403 });
        }

        const { courseId } = await req.json();

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        // Check if course exists (lookup by full ID or prefix)
        const allCourses = await dbClient.getCourses();
        const course = allCourses.find((c: any) =>
            c.id === courseId || c.id.startsWith(courseId)
        );

        if (!course) {
            return NextResponse.json({ error: 'Course not found. Please verify the Course Code (Full ID or first 6 characters).' }, { status: 404 });
        }

        if (course.status !== 'published') {
            return NextResponse.json({ error: 'This course is still being synthesized or audited. Please try again later.' }, { status: 400 });
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
