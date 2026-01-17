'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './courses.module.css';

interface Course {
    id: string;
    title: string;
    description: string;
    estimated_hours: number;
    status: string;
    teacherName?: string;
    modules: any[];
}

export default function PublicCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            // Fetch published courses (public access)
            const response = await fetch('/api/courses?status=published');
            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Failed to load courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseClick = (courseId: string) => {
        // Here we apply the logic: "if i click one of it it shouls ask for login"
        // We redirect to login with a return URL
        router.push(`/login?returnUrl=/learn/${courseId}`);
    };

    return (
        <main className={styles.container}>
            <header className={`${styles.header} glass`}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>SOVAP.in</Link>
                    <Link href="/login" className="btn-primary">Sign In</Link>
                </div>
            </header>

            <div className={`container ${styles.content}`}>
                <div className={styles.hero}>
                    <h1 className="gradient-text">Explore Courses</h1>
                    <p>Discover personalized learning paths powered by AI.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Loading catalog...</div>
                ) : courses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No courses available yet. Be the first to join when we launch!
                    </div>
                ) : (
                    <div className={styles.coursesGrid}>
                        {courses.map(course => (
                            <div key={course.id} className={`${styles.courseCard} glass-card`}>
                                <div className={styles.cardHeader}>
                                    <h3>{course.title}</h3>
                                </div>
                                <p className={styles.description}>{course.description}</p>

                                <div className={styles.courseStats}>
                                    <div className={styles.stat}>
                                        <span>📚 {course.modules?.length || 0} Modules</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span>⏱️ ~{course.estimated_hours}h</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span>By {course.teacherName}</span>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        onClick={() => handleCourseClick(course.id)}
                                        className="btn-primary"
                                        style={{ width: '100%' }}
                                    >
                                        Start Learning
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
