'use client';

import { useState, useEffect } from 'react';
import styles from './teacher.module.css';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';

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
            // In a real implementation we would use FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name.replace('.pdf', ''));

            const response = await apiCall('/api/courses/generate-from-pdf', {
                method: 'POST',
                headers: {
                    // Do not set Content-Type, fetch will set it with boundary
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUploadSuccess(data.courseId);
                alert(`Success! Generated Course ID: ${data.courseId}`);
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

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // Re-use loading state or create separate? Using global for simplicity here
        try {
            const response = await apiCall('/api/courses', {
                method: 'POST',
                body: JSON.stringify({
                    ...newCourse,
                    modules: [], // Start empty
                }),
            });

            if (response.ok) {
                alert('Course created! Waiting for College Approval.');
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

    return (
        <div className={styles.teacherContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className="gradient-text">Teacher Workbench</h1>
                    <p>{user?.name} | Faculty</p>
                </div>
                <div className={styles.actions}>
                    <button className="btn-secondary" onClick={() => setShowCreateCourse(true)} title="Manual creation is currently locked">
                        🔒 Manual Create
                    </button>
                    <label className="btn-primary" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1 }}>
                        {isUploading ? '⚙️ Processing PDF...' : '📘 Upload PDF Course'}
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                            disabled={isUploading}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </header>

            <section className={styles.stats}>
                <div className="glass-card">
                    <h4>Active Students</h4>
                    <div className={styles.statValue}>{stats.activeStudents}</div>
                    <div className={styles.statTrend} style={{ color: 'var(--success)' }}>Enrolled across your courses</div>
                </div>
                <div className="glass-card">
                    <h4>Avg. Confidence</h4>
                    <div className={styles.statValue}>{stats.avgConfidence}%</div>
                    <div className={styles.statTrend}>Platform Metric</div>
                </div>
                <div className="glass-card">
                    <h4>Completion Rate</h4>
                    <div className={styles.statValue}>{stats.completionRate}%</div>
                </div>
            </section>

            <section className={styles.courseList}>
                <div className={styles.sectionHeader}>
                    <h3>Your Courses</h3>
                </div>
                {courses.length === 0 ? (
                    <div className="glass-card text-center p-4">You haven't created any courses yet. Try uploading a syllabus PDF!</div>
                ) : (
                    courses.map(course => (
                        <div key={course.id} className="glass-card" style={{ marginBottom: '1rem' }}>
                            <div className={styles.courseRow}>
                                <div className={styles.courseInfo}>
                                    <div>
                                        <code style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>
                                            {course.id}
                                        </code>
                                        <strong>{course.title}</strong>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{course.description}</div>
                                </div>
                                <div className={styles.courseStats}>
                                    <span>{course.studentCount} Students</span>
                                    <span className={course.status === 'published' ? styles.statusBadge : styles.pending}>
                                        {course.status === 'published' ? 'Live' : 'Pending Approval'}
                                    </span>
                                </div>
                                <div className={styles.courseActions}>
                                    <button className="btn-secondary small">Analytics</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </section>

            <section className={styles.studentList}>
                <h3>Recent Student Activity</h3>
                <div className={`${styles.tableContainer} glass`}>
                    {students.length === 0 ? (
                        <div className="text-center p-4">No students enrolled yet.</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Confidence</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>{student.confidence}%</td>
                                        <td>{student.progress}%</td>
                                        <td>
                                            <span className={`${styles.badge} ${student.status === 'Mastering' ? styles.mastering : styles.ontrack}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td><button className={styles.btnLink}>View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* Create Course Modal */}
            {showCreateCourse && (
                <div className={styles.modalOverlay} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className={`${styles.modal} glass`} style={{ padding: '2rem', width: '500px', maxWidth: '90%' }}>
                        <h2>Create New Course</h2>
                        <form onSubmit={handleCreateCourse}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Course Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newCourse.title}
                                    onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                                <textarea
                                    required
                                    value={newCourse.description}
                                    onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px', minHeight: '100px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Estimated Hours</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    value={newCourse.estimatedHours}
                                    onChange={e => setNewCourse({ ...newCourse, estimatedHours: parseInt(e.target.value) || 0 })}
                                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateCourse(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
