'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import styles from './teacher-course.module.css';

interface Module {
    title: string;
    subtopics: string[];
    mcqs: any[];
}

interface CourseDetail {
    id: string;
    title: string;
    description: string;
    status: string;
    modules: Module[];
    studentCount: number;
}

export default function TeacherCourseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id: courseId } = React.use(params);
    const { user } = useAuth();
    const { showToast } = useToast();
    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourseData();
    }, [courseId]);

    const loadCourseData = async () => {
        try {
            // First get metadata
            const res = await apiCall(`/api/courses`);
            const data = await res.json();
            const foundMeta = data.courses?.find((c: any) => c.id === courseId);

            // Then get content
            const contentRes = await apiCall(`/api/courses/${courseId}/content`);
            const contentData = contentRes.ok ? await contentRes.json() : {};

            setCourse({
                ...foundMeta,
                modules: contentData.modules || [],
                studentCount: foundMeta?.studentCount || 0
            });
        } catch (e) {
            console.error(e);
            showToast('Failed to load course details', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <div style={{ height: '24px', width: '100px', background: 'var(--surface-border)', borderRadius: '4px', marginBottom: '1rem' }}></div>
                    <LoadingSkeleton type="text" count={2} />
                </header>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}><LoadingSkeleton type="text" count={2} /></div>
                    <div className={styles.statCard}><LoadingSkeleton type="text" count={2} /></div>
                    <div className={styles.statCard}><LoadingSkeleton type="text" count={2} /></div>
                </div>
                <div className={styles.contentGrid}>
                    <LoadingSkeleton type="card" count={3} />
                </div>
            </div>
        );
    }

    if (!course) return (
        <div className={styles.container}>
            <h2>Course Not Found</h2>
            <Link href="/teacher" className="btn-secondary">Back to Dashboard</Link>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link href="/teacher" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back</Link>
                        <span className="badge" style={{
                            background: course.status === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: course.status === 'published' ? '#10B981' : '#F59E0B',
                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                        }}>
                            {course.status?.toUpperCase()}
                        </span>
                    </div>
                    <h1 className="outfit" style={{ marginTop: '0.5rem' }}>{course.title}</h1>
                    <p className={styles.subtext}>{course.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href={`/learn/${courseId}`} className="btn-secondary">
                        👁️ Student Preview
                    </Link>
                    <button className="btn-primary" onClick={() => showToast('Edit feature coming soon!', 'info')}>
                        ✏️ Edit Content
                    </button>
                </div>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Enrolled Students</div>
                    <div className={styles.statValue}>{course.studentCount}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Modules</div>
                    <div className={styles.statValue}>{course.modules.length}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Avg. Engagement</div>
                    <div className={styles.statValue}>--%</div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                <section>
                    <div className={styles.sectionHeader}>
                        <h2>Course Curriculum</h2>
                    </div>
                    {course.modules.length === 0 ? (
                        <div className={styles.emptyState}>
                            No content modules found. The AI might still be generating them.
                        </div>
                    ) : (
                        <div className={styles.moduleList}>
                            {course.modules.map((mod, idx) => (
                                <div key={idx} className={styles.moduleItem}>
                                    <div>
                                        <div className={styles.moduleTitle}>
                                            {idx + 1}. {mod.title}
                                        </div>
                                        <div className={styles.moduleMeta}>
                                            {mod.subtopics?.length || 0} Topics • {mod.mcqs?.length || 0} MCQs
                                        </div>
                                    </div>
                                    <button className="btn-ghost small">View Details</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <aside>
                    <div className={styles.sectionHeader}>
                        <h2>Recent Enrollments</h2>
                    </div>
                    <div className={styles.studentList}>
                        <div className={styles.emptyState} style={{ padding: '1.5rem', border: 'none' }}>
                            No active students yet.
                        </div>
                    </div>

                    <div className={styles.sectionHeader} style={{ marginTop: '2rem' }}>
                        <h2>Assets</h2>
                    </div>
                    <div className={styles.studentList}>
                        <a
                            href={`https://github.com/ShrE333/sovap-course-storage/blob/main/courses/${courseId}/source.pdf`}
                            target="_blank"
                            className={styles.studentItem}
                            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>📄</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>Source PDF</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View on GitHub</div>
                            </div>
                        </a>
                        <a
                            href={`https://github.com/ShrE333/sovap-course-storage/blob/main/courses/${courseId}/master.json`}
                            target="_blank"
                            className={styles.studentItem}
                            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>🤖</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>Master JSON</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Raw AI Output</div>
                            </div>
                        </a>
                    </div>
                </aside>
            </div>
        </div>
    );
}
