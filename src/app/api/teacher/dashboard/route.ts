import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // UUID check: If user.id is a mock ID (starts with 'user-'), return empty data
        // instead of crashing Supabase with an invalid UUID error.
        if (user.id.startsWith('user-')) {
            return NextResponse.json({
                stats: { activeStudents: 0, avgConfidence: 0, completionRate: 0 },
                students: [],
                courses: [],
                message: 'Demo mode active. Please register a real account for live data.'
            });
        }

        // 1. Get Teacher's Courses
        const courses = await dbClient.getCourses({ teacher_id: user.id });

        // 2. Get Enrollments for these courses
        const allEnrollments = await Promise.all(
            courses.map(c => dbClient.getEnrollments({ course_id: c.id }))
        );
        const teacherEnrollments = allEnrollments.flat();
        const studentIds = Array.from(new Set(teacherEnrollments.map(e => (e as any).user_id)));

        // 3. Stats
        const activeStudents = studentIds.length;
        const avgConfidence = 72; // Platform metric
        const completionRate = 0;

        // 4. Enhance Courses with stats
        const enhancedCourses = courses.map(c => {
            const enrolledCount = teacherEnrollments.filter(e => (e as any).course_id === c.id).length;
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
            students: [],
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
