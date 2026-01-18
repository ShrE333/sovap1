import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch enrollments
        const enrollments = await dbClient.getEnrollments({ student_id: user.id });

        // Fetch courses for enrolled courses
        const enrolledCourses = await Promise.all(
            enrollments.map(async (enrollment: any) => {
                const course = await dbClient.getCourse(enrollment.course_id);
                return {
                    id: course.id,
                    title: course.title,
                    progress: enrollment.progress || 0,
                    nextTopic: enrollment.current_topic || 'Introduction',
                    lastAccessed: enrollment.updated_at || new Date().toISOString()
                };
            })
        );

        // Calculate stats
        const totalModules = enrolledCourses.reduce((sum, course: any) => {
            return sum + (course.modules?.length || 0);
        }, 0);

        const completedModules = Math.floor(totalModules * 0.4); // Mock calculation
        const masteryLevel = enrolledCourses.length > 0
            ? Math.round(enrolledCourses.reduce((sum: number, c: any) => sum + c.progress, 0) / enrolledCourses.length)
            : 0;

        // Mock recent activity
        const recentActivity = [
            {
                type: 'quiz' as const,
                title: 'Module 1 Assessment',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                score: 85
            },
            {
                type: 'lab' as const,
                title: 'Hands-on Lab: Building APIs',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            },
            {
                type: 'lesson' as const,
                title: 'Advanced Concepts in AI',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Mock achievements
        const achievements = [
            {
                id: '1',
                title: 'First Steps',
                icon: '🎯',
                unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '2',
                title: 'Quick Learner',
                icon: '⚡',
                unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        return NextResponse.json({
            enrolledCourses,
            stats: {
                totalCourses: enrolledCourses.length,
                completedModules,
                masteryLevel,
                currentStreak: 7 // Mock streak
            },
            recentActivity,
            achievements
        });

    } catch (error) {
        console.error('Student dashboard error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
