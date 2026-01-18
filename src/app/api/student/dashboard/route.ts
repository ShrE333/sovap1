import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'student') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // UUID check: If user.id is a mock ID, return empty data
        if (user.id.startsWith('user-')) {
            return NextResponse.json({
                enrolledCourses: [],
                stats: { totalCourses: 0, completedModules: 0, masteryLevel: 0, currentStreak: 0 },
                recentActivity: [],
                achievements: [],
                message: 'Demo mode active. Please register a real account for live data.'
            });
        }

        // Fetch enrollments
        const enrollments = await dbClient.getEnrollments({ user_id: user.id });

        // Fetch all courses
        const allCourses = await dbClient.getCourses();

        // Match enrollments with courses
        const enrolledCourses = enrollments
            .map((enrollment: any) => {
                const course = allCourses.find((c: any) => c.id === enrollment.course_id);
                if (!course) return null;

                return {
                    id: course.id,
                    title: course.title,
                    progress: enrollment.progress || 0,
                    nextTopic: enrollment.current_topic || 'Introduction',
                    lastAccessed: enrollment.updated_at || new Date().toISOString()
                };
            })
            .filter(Boolean); // Remove null entries

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
