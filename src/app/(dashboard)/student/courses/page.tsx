'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import styles from '../student-dashboard.module.css';

interface Course {
    id: string;
    title: string;
    description: string;
    studentCount: number;
    points: number;
    status: string;
}

export default function StudentCoursesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const response = await apiCall('/api/courses');
            const data = await response.json();
            if (response.ok) {
                // Filter only published courses
                const published = data.courses?.filter((c: any) => c.status === 'published' || c.status === 'pending_approval') || [];
                setCourses(published);
            }
        } catch (error) {
            console.error('Failed to load courses', error);
            showToast('Failed to load courses', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId: string) => {
        setEnrollingId(courseId);
        try {
            const res = await apiCall(`/api/courses/${courseId}/enroll`, { method: 'POST' });
            if (res.ok) {
                showToast('🎉 Successfully enrolled! Redirecting to course...', 'success');
                router.push(`/learn/${courseId}`);
            } else {
                showToast('Enrollment failed. You might already be enrolled.', 'warning');
            }
        } catch (e) {
            showToast('Something went wrong during enrollment.', 'error');
        } finally {
            setEnrollingId(null);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className="animate-slide-up">
                        <h1 className="outfit">Course Catalog</h1>
                        <p className={styles.subtext}>Loading available intelligence units...</p>
                    </div>
                </header>
                <div className={styles.coursesGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                    <LoadingSkeleton type="card" count={6} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className="animate-slide-up">
                    <h1 className="outfit">Course Catalog</h1>
                    <p className={styles.subtext}>Explore AI-generated intelligence units available for enrollment.</p>
                </div>
            </header>

            <div className={styles.coursesGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {courses.length === 0 ? (
                    <div className={`${styles.emptyState} glass-card`} style={{ gridColumn: '1/-1' }}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <h3>No courses available yet</h3>
                        <p>Check back later when faculty publishes new units.</p>
                    </div>
                ) : (
                    courses.map((course, idx) => (
                        <div key={course.id} className={`${styles.courseCard} glass-card`} style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className={styles.courseHeader}>
                                <h3>{course.title}</h3>
                                <span className={styles.courseProgress}>New</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                                {course.description || "No description provided."}
                            </p>
                            <div className={styles.courseFooter}>
                                <span className={styles.studentStat}>👥 {course.studentCount} Students</span>
                                <button
                                    className="btn-primary small"
                                    onClick={() => handleEnroll(course.id)}
                                    disabled={enrollingId === course.id}
                                >
                                    {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
