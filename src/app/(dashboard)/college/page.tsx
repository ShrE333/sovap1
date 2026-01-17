'use client';

import { useState, useEffect } from 'react';
import styles from './college.module.css';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';

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
                apiCall('/api/courses?status=pending_approval')
            ]);

            const teachersData = await teachersRes.json();
            const coursesData = await coursesRes.json();

            setTeachers(teachersData.teachers || []);
            // Filter strictly for pending here just in case API returns mixed
            setPendingCourses((coursesData.courses || []).filter((c: any) => c.status === 'pending_approval'));
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
                // Optimistic update
                setPendingCourses(prev => prev.filter(c => c.id !== courseId));
                alert(action === 'approve' ? 'Course Approved & Published!' : 'Course Rejected');
            } else {
                const data = await response.json();
                alert(data.error || 'Action failed');
            }
        } catch (error) {
            console.error('Approve error:', error);
        }
    };

    const totalStudents = 0; // Placeholder until enrollments API is connected

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className="gradient-text">Institution Admin</h1>
                    <p>Welcome back, {user?.name}</p>
                </div>
                <div className={styles.stats}>
                    <div className="glass-card">
                        <h4>Active Teachers</h4>
                        <span>{teachers.length}</span>
                    </div>
                    <div className="glass-card">
                        <h4>Enrolled Students</h4>
                        <span>{totalStudents}</span>
                    </div>
                    <div className="glass-card">
                        <h4>Pending Approvals</h4>
                        <span>{pendingCourses.length}</span>
                    </div>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Teacher Management Panel */}
                <section className={`${styles.panel} glass`}>
                    <div className={styles.panelHeader}>
                        <h3>Teacher Management</h3>
                        <button className="btn-primary small" onClick={() => setShowAddTeacher(true)}>
                            + Add Teacher
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center p-4">Loading...</div>
                    ) : teachers.length === 0 ? (
                        <div className="text-muted text-center p-4">No teachers added yet.</div>
                    ) : (
                        <div className={styles.list}>
                            {teachers.map(teacher => (
                                <div key={teacher.id} className={styles.listItem}>
                                    <div className={styles.info}>
                                        <strong>{teacher.name}</strong>
                                        <span className="text-muted">{teacher.email}</span>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>{teacher.courseCount} Courses</span>
                                        <span className="badge active">Active</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Course Approval Queue */}
                <section className={`${styles.panel} glass`}>
                    <div className={styles.panelHeader}>
                        <h3>Course Approvals</h3>
                    </div>

                    {loading ? (
                        <div className="text-center p-4">Loading...</div>
                    ) : pendingCourses.length === 0 ? (
                        <div className="text-muted text-center p-4">No pending courses.</div>
                    ) : (
                        <div className={styles.list}>
                            {pendingCourses.map(course => (
                                <div key={course.id} className={styles.approvalItem}>
                                    <div className={styles.courseInfo}>
                                        <h4>{course.title}</h4>
                                        <p>By {course.teacherName}</p>
                                        <small>{new Date(course.created_at).toLocaleDateString()}</small>
                                    </div>
                                    <div className={styles.actions}>
                                        <button
                                            className="btn-success small"
                                            onClick={() => handleApprove(course.id, 'approve')}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="btn-danger small"
                                            onClick={() => handleApprove(course.id, 'reject')}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Add Teacher Modal */}
            {showAddTeacher && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`}>
                        <h2>Add New Teacher</h2>

                        {credentials && (
                            <div className={styles.credentialsBox}>
                                <h3>✅ Teacher Added!</h3>
                                <p>Share these credentials securely:</p>
                                <div className={styles.codeBlock}>
                                    <p>Email: {credentials.email}</p>
                                    <p>Pass: {credentials.password}</p>
                                </div>
                                <button className="btn-primary full-width" onClick={() => {
                                    setCredentials(null);
                                    setShowAddTeacher(false);
                                }}>Done</button>
                            </div>
                        )}

                        {!credentials && (
                            <form onSubmit={handleAddTeacher}>
                                <div className={styles.inputGroup}>
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTeacher.name}
                                        onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                        placeholder="Dr. Jane Smith"
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={newTeacher.email}
                                        onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                        placeholder="jane@college.edu"
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
                                        minLength={8}
                                    />
                                </div>
                                <div className={styles.modalActions}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowAddTeacher(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Adding...' : 'Add Teacher'}
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
