'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import styles from '../teacher.module.css'; // Reusing dashboard styles or create new locals

interface EnrolledCourse {
    courseId: string;
    courseTitle: string;
    progress: number;
    status: string;
}

interface Student {
    id: string;
    name: string;
    email: string;
    enrolledCourses: EnrolledCourse[];
}

export default function TeacherStudentsPage() {
    const { showToast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const res = await apiCall('/api/teacher/students');
            const data = await res.json();
            if (res.ok) {
                setStudents(data.students || []);
            } else {
                showToast(data.error || 'Failed to load students', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to connect to student database', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.container}>
                <h1 className="outfit">Student Directory</h1>
                <LoadingSkeleton type="card" count={4} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className="outfit">Student Directory</h1>
                    <p className={styles.subtext}>Manage progress and performance for {students.length} active students.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}
                    />
                    <button className="btn-secondary" onClick={() => showToast('Exporting CSV...', 'info')}>
                        Export Data
                    </button>
                </div>
            </header>

            <div className={styles.studentList}>
                {filteredStudents.length === 0 ? (
                    <div className={styles.emptyState}>
                        {searchTerm ? 'No matching students found.' : 'No students enrolled in your courses yet.'}
                    </div>
                ) : (
                    <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Student</th>
                                    <th style={{ padding: '1rem' }}>Enrolled Courses</th>
                                    <th style={{ padding: '1rem' }}>Highest Progress</th>
                                    <th style={{ padding: '1rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => {
                                    const topProgress = Math.max(...student.enrolledCourses.map(c => c.progress), 0);

                                    return (
                                        <tr key={student.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{student.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {student.enrolledCourses.map((c, idx) => (
                                                        <span key={idx} style={{
                                                            fontSize: '0.75rem',
                                                            background: 'rgba(34, 197, 94, 0.1)',
                                                            color: '#22c55e',
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: '12px'
                                                        }}>
                                                            {c.courseTitle}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '60px', height: '6px', background: 'var(--surface-border)', borderRadius: '3px' }}>
                                                        <div style={{ width: `${topProgress}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '3px' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.9rem' }}>{topProgress.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    className="btn-ghost small"
                                                    onClick={() => showToast(`Message sent to ${student.name}`, 'success')}
                                                >
                                                    Message
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
