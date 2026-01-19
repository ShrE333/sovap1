'use client';

import { useState, useEffect } from 'react';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import styles from './college.module.css';

interface Teacher {
    id: string;
    name: string;
    email: string;
    courseCount: number;
    status?: string;
}

interface Course {
    id: string;
    title: string;
    teacherName: string;
    created_at: string;
    status: string;
}

export default function CollegeDashboard() {
    const { user } = useAuth();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddTeacher, setShowAddTeacher] = useState(false);
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

    // Form Data
    const [newTeacher, setNewTeacher] = useState({
        name: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [teachersRes, coursesRes] = await Promise.all([
                apiCall('/api/college/teachers'),
                apiCall('/api/courses')
            ]);

            const teachersData = await teachersRes.json();
            const coursesData = await coursesRes.json();

            setTeachers(teachersData.teachers || []);
            // setPendingCourses handles the view now
            setPendingCourses(coursesData.courses || []);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await apiCall('/api/college/teachers', {
                method: 'POST',
                body: JSON.stringify(newTeacher),
            });

            const data = await response.json();

            if (response.ok) {
                setCredentials(data.credentials);
                await loadDashboard();
                setNewTeacher({ name: '', email: '', password: '' });
            } else {
                alert(data.error || 'Failed to add teacher');
            }
        } catch (error) {
            console.error('Add teacher error:', error);
            alert('Failed to add teacher');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (courseId: string, action: 'approve' | 'reject') => {
        try {
            const response = await apiCall(`/api/courses/${courseId}/approve`, {
                method: 'POST',
                body: JSON.stringify({ action }),
            });

            if (response.ok) {
                setPendingCourses(prev => prev.filter(c => c.id !== courseId));
                alert(action === 'approve' ? '✨ Logic Unit Approved!' : 'Logic Unit Rejected');
            } else {
                const data = await response.json();
                alert(data.error || 'Action failed');
            }
        } catch (error) {
            console.error('Approve error:', error);
        }
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm('Permanent system purge of this intelligence unit?')) return;
        try {
            const response = await apiCall(`/api/courses/${courseId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setPendingCourses(prev => prev.filter(c => c.id !== courseId));
            } else {
                const data = await response.json();
                alert(data.error || 'Purge failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    if (loading && teachers.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Authenticating Institutional Protocols...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className="animate-slide-up">
                    <h1 className="outfit">Institution Control</h1>
                    <p className={styles.subtext}>Master Administrative Control | {user?.name}</p>
                </div>
                <div className={`${styles.licenseInfo} animate-slide-up`} style={{ animationDelay: '0.1s' }}>
                    <div className={styles.expiryBadge}>Enterprise Active</div>
                    <span className={styles.licenseDate}>Renew: Jan 2027</span>
                </div>
            </header>

            {/* Stats Overview */}
            <section className={styles.statsGrid}>
                <div className={`${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.2s' }}>
                    <div className={styles.statLabel}>Active Faculty</div>
                    <div className={styles.statValue}>{teachers.length}</div>
                </div>
                <div className={`${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.3s' }}>
                    <div className={styles.statLabel}>Pending Logic</div>
                    <div className={styles.statValue}>{pendingCourses.length}</div>
                </div>
                <div className={`${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.4s' }}>
                    <div className={styles.statLabel}>Active Students</div>
                    <div className={styles.statValue}>1,240</div>
                </div>
                <div className={`${styles.statCard} animate-slide-up`} style={{ animationDelay: '0.5s' }}>
                    <div className={styles.statLabel}>AI Efficiency</div>
                    <div className={styles.statValue}>84%</div>
                </div>
            </section>

            <div className={styles.mainGrid}>
                {/* Faculty Management */}
                <section className={styles.panelSection}>
                    <div className={styles.panelHeader}>
                        <h2>Faculty Management</h2>
                        <button className="btn-primary small" onClick={() => setShowAddTeacher(true)}>
                            + Add Professor
                        </button>
                    </div>

                    <div className={`${styles.panelBody} glass`}>
                        {teachers.length === 0 ? (
                            <div className={styles.emptyInternal}>No faculty members registered.</div>
                        ) : (
                            <div className={styles.list}>
                                {teachers.map((teacher, idx) => (
                                    <div key={teacher.id} className={styles.listItem} style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div className={styles.info}>
                                            <div className={styles.name}>{teacher.name}</div>
                                            <div className={styles.email}>{teacher.email}</div>
                                        </div>
                                        <div className={styles.meta}>
                                            <span className={styles.count}>{teacher.courseCount} Courses</span>
                                            <span className={styles.statusActive}>Active</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Cognitive Logic Approvals */}
                <section className={styles.panelSection}>
                    <div className={styles.panelHeader}>
                        <h2>Course Logic Approvals</h2>
                        <span className={styles.countBadge}>{pendingCourses.length} Pending</span>
                    </div>

                    <div className={`${styles.panelBody} glass`}>
                        {pendingCourses.length === 0 ? (
                            <div className={styles.emptyInternal}>All cognitive units are up-to-date.</div>
                        ) : (
                            <div className={styles.list}>
                                {pendingCourses.map((course, idx) => (
                                    <div key={course.id} className={styles.approvalItem} style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div className={styles.courseHeader}>
                                            <h3>
                                                {course.title}
                                                <span className={styles.statusMini} data-status={course.status}>
                                                    {course.status === 'generating' ? '🧪' : course.status === 'published' ? '🟢' : '🕒'}
                                                </span>
                                            </h3>
                                            <p>By {course.teacherName} | Status: {course.status?.toUpperCase() || 'UNKNOWN'}</p>
                                        </div>
                                        <div className={styles.approvalActions}>
                                            {course.status === 'pending_approval' && (
                                                <>
                                                    <button className="btn-success small" onClick={() => handleApprove(course.id, 'approve')}>Approve</button>
                                                    <button className="btn-danger small" onClick={() => handleApprove(course.id, 'reject')}>Reject</button>
                                                </>
                                            )}
                                            <button className={`${styles.deleteBtn || 'btn-danger'} small`} onClick={() => handleDelete(course.id)} title="Purge Course">🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Modal */}
            {showAddTeacher && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`}>
                        <div className={styles.modalHeader}>
                            <h2>Register New Faculty</h2>
                        </div>

                        {credentials ? (
                            <div className={styles.credentialsBox}>
                                <h3>✅ Account Synthesized</h3>
                                <p>Provide these credentials to the professor:</p>
                                <div className={styles.codeBlock}>
                                    <div>Email: <code>{credentials.email}</code></div>
                                    <div>Password: <code>{credentials.password}</code></div>
                                </div>
                                <button className="btn-primary full-width" onClick={() => { setCredentials(null); setShowAddTeacher(false); }}>Done</button>
                            </div>
                        ) : (
                            <form onSubmit={handleAddTeacher} className={styles.modalForm}>
                                <div className={styles.inputGroup}>
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTeacher.name}
                                        onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                        placeholder="Dr. Julian Vane"
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={newTeacher.email}
                                        onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                        placeholder="julian@college.edu"
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Temporary Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newTeacher.password}
                                        onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className={styles.modalFooter}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddTeacher(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Synthesizing...' : 'Register Faculty'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
