'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import styles from './student-dashboard.module.css';

interface DashboardData {
    enrolledCourses: Array<{
        id: string;
        title: string;
        progress: number;
        nextTopic: string;
        lastAccessed: string;
    }>;
    stats: {
        totalCourses: number;
        completedModules: number;
        masteryLevel: number;
        currentStreak: number;
    };
    recentActivity: Array<{
        type: 'quiz' | 'lab' | 'lesson';
        title: string;
        timestamp: string;
        score?: number;
    }>;
    achievements: Array<{
        id: string;
        title: string;
        icon: string;
        unlockedAt: string;
    }>;
}

export default function StudentDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await apiCall('/api/student/dashboard');
            const result = await response.json();

            if (response.ok) {
                setData(result);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading your learning dashboard...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className="gradient-text">{greeting}, {user?.name}! 👋</h1>
                    <p className={styles.heroSubtext}>
                        Ready to continue your AI-powered learning journey?
                    </p>
                </div>
                <div className={styles.heroStats}>
                    <div className={styles.heroStat}>
                        <div className={styles.heroStatValue}>{data?.stats.currentStreak || 0}</div>
                        <div className={styles.heroStatLabel}>Day Streak 🔥</div>
                    </div>
                    <div className={styles.heroStat}>
                        <div className={styles.heroStatValue}>{data?.stats.masteryLevel || 0}%</div>
                        <div className={styles.heroStatLabel}>Mastery Level</div>
                    </div>
                </div>
            </section>

            {/* Quick Stats */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statIcon}>📚</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{data?.stats.totalCourses || 0}</div>
                        <div className={styles.statLabel}>Active Courses</div>
                    </div>
                </div>
                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{data?.stats.completedModules || 0}</div>
                        <div className={styles.statLabel}>Modules Completed</div>
                    </div>
                </div>
                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statIcon}>🎯</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{data?.stats.masteryLevel || 0}%</div>
                        <div className={styles.statLabel}>Overall Mastery</div>
                    </div>
                </div>
                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statIcon}>⚡</div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{data?.recentActivity?.length || 0}</div>
                        <div className={styles.statLabel}>Recent Activities</div>
                    </div>
                </div>
            </div>

            <div className={styles.mainContent}>
                {/* Continue Learning */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Continue Learning</h2>
                        <Link href="/student/courses" className={styles.viewAll}>
                            View All →
                        </Link>
                    </div>

                    {data?.enrolledCourses && data.enrolledCourses.length > 0 ? (
                        <div className={styles.coursesList}>
                            {data.enrolledCourses.slice(0, 3).map((course, index) => (
                                <div
                                    key={course.id}
                                    className={`${styles.courseCard} glass-card`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={styles.courseHeader}>
                                        <h3>{course.title}</h3>
                                        <span className={styles.courseProgress}>{course.progress}%</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                    <div className={styles.courseFooter}>
                                        <span className={styles.nextTopic}>
                                            Next: {course.nextTopic}
                                        </span>
                                        <Link
                                            href={`/learn/${course.id}`}
                                            className="btn-primary small"
                                        >
                                            Continue →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`${styles.emptyState} glass-card`}>
                            <div className={styles.emptyIcon}>🎓</div>
                            <h3>No active courses yet</h3>
                            <p>Start your learning journey by enrolling in a course</p>
                            <Link href="/student/courses" className="btn-primary">
                                Browse Courses
                            </Link>
                        </div>
                    )}
                </section>

                {/* Recent Activity */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Recent Activity</h2>
                        <Link href="/student/progress" className={styles.viewAll}>
                            View All →
                        </Link>
                    </div>

                    {data?.recentActivity && data.recentActivity.length > 0 ? (
                        <div className={`${styles.activityList} glass`}>
                            {data.recentActivity.slice(0, 5).map((activity, index) => (
                                <div key={index} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>
                                        {activity.type === 'quiz' && '📝'}
                                        {activity.type === 'lab' && '🧪'}
                                        {activity.type === 'lesson' && '📖'}
                                    </div>
                                    <div className={styles.activityContent}>
                                        <div className={styles.activityTitle}>{activity.title}</div>
                                        <div className={styles.activityTime}>
                                            {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                    {activity.score !== undefined && (
                                        <div className={styles.activityScore}>
                                            {activity.score}%
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`${styles.emptyState} glass-card`}>
                            <div className={styles.emptyIcon}>📊</div>
                            <p>No recent activity to show</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Achievements */}
            {data?.achievements && data.achievements.length > 0 && (
                <section className={styles.achievementsSection}>
                    <h2>Recent Achievements 🏆</h2>
                    <div className={styles.achievementsList}>
                        {data.achievements.slice(0, 4).map((achievement, index) => (
                            <div
                                key={achievement.id}
                                className={`${styles.achievementCard} glass-card`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={styles.achievementIcon}>{achievement.icon}</div>
                                <div className={styles.achievementTitle}>{achievement.title}</div>
                                <div className={styles.achievementDate}>
                                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <Link href="/student/courses" className={`${styles.actionCard} glass-card`}>
                    <div className={styles.actionIcon}>📚</div>
                    <div className={styles.actionTitle}>Browse Courses</div>
                    <div className={styles.actionArrow}>→</div>
                </Link>
                <Link href="/student/progress" className={`${styles.actionCard} glass-card`}>
                    <div className={styles.actionIcon}>📊</div>
                    <div className={styles.actionTitle}>View Progress</div>
                    <div className={styles.actionArrow}>→</div>
                </Link>
                <Link href="/student/skills" className={`${styles.actionCard} glass-card`}>
                    <div className={styles.actionIcon}>🎯</div>
                    <div className={styles.actionTitle}>Skill Map</div>
                    <div className={styles.actionArrow}>→</div>
                </Link>
                <Link href="/student/certs" className={`${styles.actionCard} glass-card`}>
                    <div className={styles.actionIcon}>🏅</div>
                    <div className={styles.actionTitle}>Certificates</div>
                    <div className={styles.actionArrow}>→</div>
                </Link>
            </section>
        </div>
    );
}
