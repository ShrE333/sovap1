
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Get Teacher's Courses
        const courses = await dbClient.getCourses({ teacher_id: user.id });

        // 2. Get Enrollments for these courses
        const allEnrollments = await Promise.all(
            courses.map(c => dbClient.getEnrollments({ course_id: c.id }))
        );
        const teacherEnrollments = allEnrollments.flat();
        const studentIds = Array.from(new Set(teacherEnrollments.map(e => e.user_id)));

        // 3. Stats
        const activeStudents = studentIds.length;
        const avgConfidence = 72; // Mock
        const completionRate = 0; // Mock

        // 4. Enhance Courses with stats
        const enhancedCourses = courses.map(c => {
            const enrolledCount = teacherEnrollments.filter(e => e.course_id === c.id).length;
            return {
                id: c.id,
                title: c.title,
                studentCount: enrolledCount,
                status: c.status,
                modulesCount: (c as any).modules?.length || 0,
                description: (c as any).description
            };
        });

        return NextResponse.json({
            stats: {
                activeStudents,
                avgConfidence,
                completionRate
            },
            students: [], // Placeholder or fetch student details if needed
            courses: enhancedCourses
        });

    } catch (error) {
        console.error('Get teacher dashboard error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
