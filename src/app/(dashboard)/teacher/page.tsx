'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import styles from './teacher.module.css';

interface Student {
    id: string;
    name: string;
    confidence: number;
    progress: number;
    status: string;
}

interface Course {
    id: string;
    title: string;
    description: string;
    status: string;
    studentCount: number;
    isOwner?: boolean;
    teacherName?: string;
    creatorRole?: string;
}

interface DashboardStats {
    activeStudents: number;
    avgConfidence: number;
    completionRate: number;
}

export default function TeacherPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({ activeStudents: 0, avgConfidence: 0, completionRate: 0 });
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    // Form
    const [newCourse, setNewCourse] = useState({
        title: '',
        description: '',
        estimatedHours: 10
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await apiCall('/api/teacher/dashboard');
            const data = await response.json();

            if (response.ok) {
                setStats(data.stats);
                setStudents(data.students || []);
                setCourses(data.courses || []);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloneCourse = async (courseId: string) => {
        if (!confirm('Do you want to clone this course to your account?')) return;

        try {
            const res = await apiCall(`/api/courses/${courseId}/clone`, {
                method: 'POST'
            });
            if (res.ok) {
                alert('✨ Course cloned and adapted successfully!');
                loadDashboard();
            } else {
                alert('Failed to clone course.');
            }
        } catch (error) {
            console.error('Clone error:', error);
        }
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a valid PDF file.');
            return;
        }

        setIsUploading(true);
        setUploadSuccess(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name.replace('.pdf', ''));

            const response = await apiCall('/api/courses/generate-from-pdf', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUploadSuccess(data.courseId);
                alert(`✨ MAGIC SUCCESS! Course generation started for: ${file.name}`);
                loadDashboard();
            } else {
                const data = await response.json();
                alert(`Upload failed: ${data.error || 'Server error'}`);
            }
        } catch (error) {
            console.error('PDF upload error:', error);
            alert('An unexpected error occurred during upload.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiCall('/api/courses', {
                method: 'POST',
                body: JSON.stringify({
                    ...newCourse,
                    modules: [],
                }),
            });

            if (response.ok) {
                alert('✨ MAGIC SUCCESS! Course generation started. It will appear on your dashboard as "Generating" and then "Live" automatically.');
                setShowCreateCourse(false);
                setNewCourse({ title: '', description: '', estimatedHours: 10 });
                loadDashboard();
            } else {
                const data = await response.json();
                alert(`Failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Create course error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm('Are you absolutely sure you want to delete this intelligence unit? This action is irreversible.')) return;

        try {
            const response = await apiCall(`/api/courses/${courseId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                loadDashboard();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete course');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    if (loading && !stats.activeStudents && courses.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Establishing secure connection to Faculty Workbench...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className="animate-slide-up">
                    <h1 className="outfit">Faculty Workbench</h1>
                    <p className={styles.subtext}>Welcome back, {user?.name}. Orchestrate your intelligence units here.</p>
                </div>
                <div className={`${styles.headerActions} animate-slide-up`} style={{ animationDelay: '0.1s' }}>
                    <button className="btn-secondary" onClick={() => setShowCreateCourse(true)}>
                        ✨ Magic AI
                    </button>
                    <label className="btn-primary" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1 }}>
                        {isUploading ? '🪄 Synthesizing...' : '📘 PDF Import'}
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                            disabled={isUploading}
                            className={styles.hiddenInput}
                        />
                    </label>
                </div>
            </header>

            {/* Stats Panel */}
            <section className={styles.statsGrid}>
                <div className={`${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.2s' }}>
                    <div className={styles.statLabel}>Active Students</div>
                    <div className={styles.statValue}>{stats.activeStudents}</div>
                </div>
                <div className={`${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.3s' }}>
                    <div className={styles.statLabel}>Avg. Confidence</div>
                    <div className={styles.statValue}>{stats.avgConfidence}%</div>
                </div>
                <div className={`${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.4s' }}>
                    <div className={styles.statLabel}>Completion Rate</div>
                    <div className={styles.statValue}>{stats.completionRate}%</div>
                </div>
            </section>

            <div className={styles.dashboardGrid}>
                {/* Courses Section */}
                <section className={styles.mainSection}>
                    <div className={styles.sectionHeader}>
                        <h2>Your Active Intelligence Units</h2>
                        <span className={styles.countBadge}>{courses.length} Units</span>
                    </div>

                    {courses.length === 0 ? (
                        <div className={`${styles.emptyState} glass-card`}>
                            <div className={styles.emptyIcon}>🧪</div>
                            <h3>No logic units found</h3>
                            <p>Upload a syllabus PDF or use Magic AI to generate a new course structure.</p>
                        </div>
                    ) : (
                        <div className={styles.courseList}>
                            {courses.map((course, idx) => (
                                <div key={course.id} className={`${styles.courseCard} glass-card`} style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className={styles.courseMeta}>
                                        <div className={styles.metaLeft}>
                                            <span className={styles.idTag}>ID: {course.id.split('-')[1] || course.id.slice(0, 6)}</span>
                                            {course.isOwner ? (
                                                <span className={styles.ownerBadge}>OWNED</span>
                                            ) : (
                                                <span className={styles.sharedBadge}>SHARED: {course.teacherName}</span>
                                            )}
                                            {course.creatorRole === 'college' && (
                                                <span className={styles.publicBadge}>🏛️ PUBLIC</span>
                                            )}
                                        </div>
                                        <span className={`${styles.statusBadge} ${course.status === 'published' ? styles.statusLive :
                                            course.status === 'generating' ? styles.statusGenerating :
                                                styles.statusPending
                                            }`}>
                                            {course.status === 'published' ? '🟢 LIVE' :
                                                course.status === 'generating' ? '🧪 GENERATING' :
                                                    '🕒 PENDING APPROVAL'}
                                        </span>
                                    </div>
                                    <h3 className={styles.courseTitle}>{course.title}</h3>
                                    <p className={styles.courseDesc}>{course.description}</p>
                                    <div className={styles.courseFooter}>
                                        <span className={styles.studentStat}>
                                            {course.status === 'published' ? (
                                                <><strong>{course.studentCount}</strong> Students Enrolled</>
                                            ) : (
                                                <em style={{ color: 'var(--text-muted)' }}>{course.status === 'generating' ? 'AI Agent busy...' : 'Finalizing...'}</em>
                                            )}
                                        </span>
                                        <div className={styles.cardActions}>
                                            {course.isOwner ? (
                                                <>
                                                    <button
                                                        className="btn-secondary small"
                                                        onClick={() => handleDeleteCourse(course.id)}
                                                        title="Delete Unit"
                                                    >
                                                        🗑️
                                                    </button>
                                                    {course.status === 'published' && <button className="btn-secondary small">Analytics</button>}
                                                    <Link href={`/learn/${course.id}`} className="btn-primary small">
                                                        {course.status === 'published' ? 'Manage' : 'Preview'}
                                                    </Link>
                                                </>
                                            ) : (
                                                <button
                                                    className="btn-primary small"
                                                    onClick={() => handleCloneCourse(course.id)}
                                                >
                                                    🪄 Clone & Adapt
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Students Activity Section */}
                <section className={styles.sideSection}>
                    <div className={styles.sectionHeader}>
                        <h2>Real-time Activity</h2>
                    </div>

                    <div className={`${styles.activityList} glass`}>
                        {students.length === 0 ? (
                            <div className={styles.emptyActivity}>No student activity detected yet.</div>
                        ) : (
                            students.map((student, idx) => (
                                <div key={student.id} className={styles.activityItem} style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <div className={styles.studentAvatar}>
                                        {student.name.charAt(0)}
                                    </div>
                                    <div className={styles.activityInfo}>
                                        <div className={styles.studentName}>{student.name}</div>
                                        <div className={styles.studentMeta}>
                                            <span>{student.progress}% Done</span>
                                            <span>•</span>
                                            <span className={student.status === 'Mastering' ? styles.masteringText : styles.onTrackText}>
                                                {student.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.studentConfidence}>
                                        <div className={styles.confidenceLabel}>Confidence</div>
                                        <div className={styles.confidenceValue}>{student.confidence}%</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Magic Create Modal */}
            {showCreateCourse && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`}>
                        <div className={styles.modalHeader}>
                            <h2>✨ Magic AI Course Creation</h2>
                            <button className={styles.closeBtn} onClick={() => setShowCreateCourse(false)}>×</button>
                        </div>
                        <p className={styles.modalSubtext}>Provide a title, and our agents will handle the rest. Description and hours are optional.</p>

                        <form onSubmit={handleCreateCourse} className={styles.modalForm}>
                            <div className={styles.inputGroup}>
                                <label>Course Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Advanced Quantum Computing"
                                    value={newCourse.title}
                                    onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Context & Scope (Optional)</label>
                                <textarea
                                    placeholder="Briefly describe the target audience or topics (optional)..."
                                    value={newCourse.description}
                                    onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Estimated Hours (Optional)</label>
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="10"
                                    value={newCourse.estimatedHours}
                                    onChange={e => setNewCourse({ ...newCourse, estimatedHours: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className="btn-ghost" onClick={() => setShowCreateCourse(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? '🪄 Generating...' : 'Start Magic Generation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
