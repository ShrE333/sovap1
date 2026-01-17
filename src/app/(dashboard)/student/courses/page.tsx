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

export default function StudentCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            // Fetch published courses
            const response = await apiCall('/api/courses?status=published');
            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Failed to load courses:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className="gradient-text">My Learning Path</h1>
                <p>Choose a course and let our AI adapt to your cognitive style.</p>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading courses...</div>
            ) : courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No courses available yet. Check back later!
                </div>
            ) : (
                <div className={styles.coursesGrid}>
                    {courses.map(course => (
                        <div key={course.id} className={`${styles.courseCard} glass-card`}>
                            <div className={styles.cardHeader}>
                                <h3>{course.title}</h3>
                                {/* Enrolled logic to be added later */}
                            </div>
                            <p className={styles.description}>{course.description}</p>

                            <div className={styles.courseStats}>
                                <div className={styles.stat}>
                                    <span className={styles.statIcon}>📚</span>
                                    <span>{course.modules?.length || 0} Modules</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statIcon}>⏱️</span>
                                    <span>~{course.estimated_hours}h</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statIcon}>👨‍🏫</span>
                                    <span>{course.teacherName}</span>
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <Link href={`/learn/${course.id}`} className="btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
                                    Start Course
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
