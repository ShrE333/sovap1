'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './courses.module.css';
import { apiCall } from '@/lib/contexts/AuthContext';

interface Course {
    id: string;
    title: string;
    description: string;
    modules: any[];
    estimated_hours: number;
    status: string;
    teacherName?: string;
}

interface Enrollment {
    courseId: string;
    progress: number;
    lastAccessed: string;
    status: 'active' | 'completed' | 'paused';
}

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch published courses (this will be filtered by API now)
            const coursesRes = await apiCall('/api/courses?status=published');
            const coursesData = await coursesRes.json();
            setCourses(coursesData.courses || []);

            // Fetch enrollments
            const enrollRes = await apiCall('/api/enrollments');
            const enrollData = await enrollRes.json();
            setEnrollments(enrollData.enrollments || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinByCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setJoining(true);
        try {
            const res = await apiCall('/api/enrollments', {
                method: 'POST',
                body: JSON.stringify({ courseId: joinCode.trim() })
            });
            const data = await res.json();

            if (res.ok) {
                alert('Successfully joined the course!');
                setJoinCode('');
                loadData();
            } else {
                alert(data.error || 'Failed to join course. Check the code.');
            }
        } catch (err) {
            alert('Something went wrong. Please try again.');
        } finally {
            setJoining(false);
        }
    };

    const getEnrollment = (courseId: string) => {
        return enrollments.find(e => e.courseId === courseId);
    };

    const filteredCourses = courses.filter(course => {
        const enrollment = getEnrollment(course.id);
        if (filter === 'enrolled') return !!enrollment;
        if (filter === 'available') return !enrollment;
        return true;
    });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <div>
                        <h1 className="gradient-text">My Learning Journey</h1>
                        <p>AI-powered adaptive learning tailored to your cognitive profile</p>
                    </div>

                    <form onSubmit={handleJoinByCode} className={styles.joinForm}>
                        <input
                            type="text"
                            placeholder="Course Code (e.g. course-uuid)"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className={styles.joinInput}
                        />
                        <button type="submit" disabled={joining} className={styles.joinButton}>
                            {joining ? 'Joining...' : 'Join Course'}
                        </button>
                    </form>
                </div>

                <div className={styles.filterTabs}>
                    <button
                        className={filter === 'all' ? styles.activeTab : styles.tab}
                        onClick={() => setFilter('all')}
                    >
                        All Courses
                    </button>
                    <button
                        className={filter === 'enrolled' ? styles.activeTab : styles.tab}
                        onClick={() => setFilter('enrolled')}
                    >
                        My Courses
                    </button>
                    <button
                        className={filter === 'available' ? styles.activeTab : styles.tab}
                        onClick={() => setFilter('available')}
                    >
                        Explore (Public)
                    </button>
                </div>
            </header>

            {loading ? (
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading your personalized courses...</p>
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📚</div>
                    <h3>No courses found</h3>
                    <p>
                        {filter === 'enrolled'
                            ? 'You haven\'t enrolled in any courses yet. Explore available courses!'
                            : 'No courses available yet. Check back later!'}
                    </p>
                </div>
            ) : (
                <div className={styles.coursesGrid}>
                    {filteredCourses.map((course, index) => {
                        const enrollment = getEnrollment(course.id);
                        const isEnrolled = !!enrollment;

                        return (
                            <div
                                key={course.id}
                                className={`${styles.courseCard} glass-card`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={styles.cardGlow}></div>

                                <div className={styles.cardHeader}>
                                    <div className={styles.titleSection}>
                                        <h3>{course.title}</h3>
                                        {isEnrolled && (
                                            <span className={styles.enrolledBadge}>
                                                ✓ Enrolled
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.courseId}>#{course.id.slice(0, 6)}</div>
                                </div>

                                <p className={styles.description}>{course.description}</p>

                                {isEnrolled && enrollment && (
                                    <div className={styles.progressSection}>
                                        <div className={styles.progressHeader}>
                                            <span>Progress</span>
                                            <span className={styles.progressPercent}>{enrollment.progress}%</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div
                                                className={styles.progressFill}
                                                style={{ width: `${enrollment.progress}%` }}
                                            ></div>
                                        </div>
                                        <div className={styles.lastAccessed}>
                                            Last accessed: {new Date(enrollment.lastAccessed).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.courseStats}>
                                    <div className={styles.stat}>
                                        <span className={styles.statIcon}>📚</span>
                                        <span>
                                            {course.modules?.length > 0
                                                ? `${course.modules.length} Modules`
                                                : (course.status === 'published' ? 'AI Generating...' : 'Pending AI')}
                                        </span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statIcon}>⏱️</span>
                                        <span>{course.modules?.length > 0 ? `${course.modules.length * 2}h` : 'TBD'}</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statIcon}>🎯</span>
                                        <span>Adaptive</span>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    {isEnrolled ? (
                                        <Link
                                            href={`/learn/${course.id}`}
                                            className="btn-primary"
                                        >
                                            Continue Learning →
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/student/courses/${course.id}/pre-test`}
                                            className="btn-primary"
                                        >
                                            Start with Diagnostic Test
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
