import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/mock-db';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Get Teacher's Courses
        const courses = db.courses.filter(c => c.teacher_id === user.id);

        // 2. Get Students Enrolled in these courses
        // We want unique students
        const studentIds = new Set<string>();
        const teacherEnrollments = db.enrollments.filter(e => {
            const isMyCourse = courses.some(c => c.id === e.course_id);
            if (isMyCourse) studentIds.add(e.user_id);
            return isMyCourse;
        });

        const students = db.users.filter(u => studentIds.has(u.id)).map(s => {
            // Calculate aggregate confidence/progress for this student across teacher's courses
            const studentEnrollments = teacherEnrollments.filter(e => e.user_id === s.id);
            const avgProgress = studentEnrollments.reduce((acc, curr) => acc + curr.progress, 0) / (studentEnrollments.length || 1);

            return {
                id: s.id,
                name: s.name,
                email: s.email,
                confidence: 70, // Mock for now as we don't track confidence in mock-db yet
                progress: Math.round(avgProgress),
                status: avgProgress > 80 ? 'Mastering' : avgProgress > 40 ? 'On Track' : 'Struggling'
            };
        });

        // 3. Stats
        const activeStudents = studentIds.size;
        const avgConfidence = 72; // Mock
        const completionRate = 0; // Mock

        // 4. Enhance Courses with stats
        const enhancedCourses = courses.map(c => {
            const enrolledCount = db.enrollments.filter(e => e.course_id === c.id).length;
            return {
                id: c.id,
                title: c.title,
                studentCount: enrolledCount,
                status: c.status,
                modulesCount: c.modules.length,
                description: c.description // Added for UI
            };
        });

        return NextResponse.json({
            stats: {
                activeStudents,
                avgConfidence,
                completionRate
            },
            students,
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
