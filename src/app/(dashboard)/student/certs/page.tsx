'use client';

import { useState, useEffect } from 'react';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import styles from './certs.module.css';

interface EnrolledCourse {
    id: string;
    title: string;
    progress: number;
    lastAccessed: string;
}

export default function CertificatesPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCerts = async () => {
            try {
                const response = await apiCall('/api/student/dashboard'); // Helper to get enrolled courses
                if (!response.ok) {
                    throw new Error('Failed to load certificates');
                }
                const data = await response.json();

                // Filter for completed courses (progress >= 100)
                const completed = (data.enrolledCourses || []).filter((c: EnrolledCourse) => c.progress >= 100);
                setCourses(completed);
            } catch (error) {
                console.error('Error fetching certificates:', error);
                showToast('Failed to load certificates', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchCerts();
        }
    }, [user, showToast]);

    const handleDownload = async (courseId: string, courseTitle: string) => {
        showToast('Generating certificate...', 'info');
        try {
            // Trigger download
            const response = await apiCall(`/api/certificates/generate?courseId=${courseId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Download failed');
            }

            // Create blob and force download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Certificate downloaded!', 'success');
        } catch (error: any) {
            console.error('Certificate download error:', error);
            showToast(error.message || 'Failed to generate certificate', 'error');
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <LoadingSkeleton type="text" count={1} />
                </div>
                <div className={styles.grid}>
                    <LoadingSkeleton type="card" count={3} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className="gradient-text">My Certificates</h1>
                <p>Verify and download your earned credentials.</p>
            </div>

            {courses.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.icon}>🎓</div>
                    <h2>No Certificates Yet</h2>
                    <p>Complete a course with 100% progress to earn your first certificate.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {courses.map(course => (
                        <div key={course.id} className={styles.certCard}>
                            <div className={styles.icon}>📜</div>
                            <div className={styles.courseTitle}>{course.title}</div>
                            <div className={styles.date}>Completed on {new Date(course.lastAccessed).toLocaleDateString()}</div>

                            <button
                                className={styles.downloadBtn}
                                onClick={() => handleDownload(course.id, course.title)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Download PDF
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
