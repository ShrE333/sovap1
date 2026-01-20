'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

interface College {
    id: string;
    name: string;
    admin_email: string;
    adminName?: string;
    license_count: number;
    courses_limit: number;
    license_expiry: string;
    status: string;
    studentCount?: number;
    teachersCount?: number;
    coursesCount?: number;
    aiUsage?: number;
    created_at: string;
}

export default function AdminCollegesPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [colleges, setColleges] = useState<College[]>([]);
    const [showAddCollege, setShowAddCollege] = useState(false);
    const [showEditCollege, setShowEditCollege] = useState(false);
    const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
    const [loading, setLoading] = useState(true);
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        adminEmail: '',
        adminPassword: '',
        adminName: '',
        licenseCount: 1000,
        coursesLimit: 50,
        coursesCount: 0,
        licenseExpiry: '',
        status: 'active' as 'active' | 'expired' | 'pending',
    });

    useEffect(() => {
        loadColleges();
    }, []);

    const loadColleges = async () => {
        try {
            const response = await apiCall('/api/admin/colleges');
            const data = await response.json();
            setColleges(data.colleges || []);
        } catch (error) {
            console.error('Failed to load colleges:', error);
            showToast('Failed to load colleges', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCollege = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await apiCall('/api/admin/colleges', {
                method: 'POST',
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setCredentials(data.credentials);
                await loadColleges();
                setFormData({
                    name: '',
                    adminEmail: '',
                    adminPassword: '',
                    adminName: '',
                    licenseCount: 1000,
                    coursesLimit: 50,
                    coursesCount: 0,
                    licenseExpiry: '',
                    status: 'active',
                });
                showToast('College created successfully!', 'success');
            } else {
                console.error('Create college failed:', data);
                let errorMessage = data.error || 'Unknown error';
                if (data.details) {
                    errorMessage += ': ' + JSON.stringify(data.details);
                }
                showToast(`Failed to create college: ${errorMessage}`, 'error');
            }
        } catch (error: any) {
            console.error('Create college error:', error);
            showToast(`Failed to create college: ${error.message || 'Network error'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCollege = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCollege) return;

        setLoading(true);
        try {
            const response = await apiCall(`/api/admin/colleges/${selectedCollege.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    licenseCount: formData.licenseCount,
                    coursesLimit: formData.coursesLimit,
                    licenseExpiry: formData.licenseExpiry,
                    status: formData.status,
                    // New Admin Updates
                    adminName: formData.adminName,
                    adminEmail: formData.adminEmail,
                    adminPassword: formData.adminPassword || undefined, // Send undefined if empty
                }),
            });

            if (response.ok) {
                await loadColleges();
                setShowEditCollege(false);
                setSelectedCollege(null);
                showToast('College updated successfully!', 'success');
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to update college', 'error');
            }
        } catch (error) {
            console.error('Update college error:', error);
            showToast('Failed to update college', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (college: College) => {
        setSelectedCollege(college);
        setFormData({
            name: college.name,
            adminEmail: college.admin_email,
            adminPassword: '', // Don't pre-fill password
            adminName: college.adminName || '',
            licenseCount: college.license_count,
            coursesLimit: college.courses_limit,
            coursesCount: college.coursesCount || 0,
            licenseExpiry: college.license_expiry.split('T')[0],
            status: college.status as 'active' | 'expired' | 'pending',
        });
        setShowEditCollege(true);
    };

    return (
        <div className={styles.adminContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className="gradient-text">Institutions & Licenses</h1>
                    <p>Manage college access and capacities.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddCollege(true)}>
                    + Add College
                </button>
            </header>

            <section className={`${styles.panel} glass`}>
                {loading ? (
                    <div style={{ padding: '2rem' }}>
                        <div className={styles.list}>
                            <LoadingSkeleton type="card" count={4} />
                        </div>
                    </div>
                ) : (
                    <>
                        {colleges.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                No colleges added yet. Click "+ Add College" to get started.
                            </div>
                        ) : (
                            <div className={styles.list}>
                                {colleges.map(college => (
                                    <div key={college.id} className={styles.collegeCard}>
                                        <div className={styles.collegeInfo}>
                                            <strong>{college.name}</strong>
                                            <div className={styles.statsGrid}>
                                                <div className={styles.statItem}>
                                                    <span className={styles.label}>Licenses:</span>
                                                    <span className={styles.value}>{college.license_count}</span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.label}>Expires:</span>
                                                    <span className={styles.value}>{new Date(college.license_expiry).toLocaleDateString()}</span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.label}>Teachers:</span>
                                                    <span className={styles.value}>{college.teachersCount || 0}</span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.label}>Students:</span>
                                                    <span className={styles.value}>{college.studentCount || 0}</span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.label}>Courses:</span>
                                                    <span className={styles.value}>{college.coursesCount || 0} / {college.courses_limit}</span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.label}>AI Tokens:</span>
                                                    <span className={styles.value}>{college.aiUsage?.toLocaleString() || '0'}</span>
                                                </div>
                                            </div>
                                            <div className={styles.subText}>
                                                Admin: {college.adminName} ({college.admin_email})
                                            </div>
                                        </div>
                                        <span className={`${styles.badge} ${styles[college.status.toLowerCase().replace(/ /g, '')]}`}>
                                            {college.status}
                                        </span>
                                        <button className="btn-secondary small" onClick={() => openEditModal(college)}>
                                            Manage
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Add College Modal */}
            {showAddCollege && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`}>
                        <h2>Add New College</h2>

                        {credentials && (
                            <div className={styles.credentialsBox}>
                                <h3>✅ College Created Successfully!</h3>
                                <p><strong>SAVE THESE CREDENTIALS:</strong></p>
                                <div className={styles.credentialItem}>
                                    <label>Email:</label>
                                    <code>{credentials.email}</code>
                                </div>
                                <div className={styles.credentialItem}>
                                    <label>Password:</label>
                                    <code>{credentials.password}</code>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        setCredentials(null);
                                        setShowAddCollege(false);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        )}

                        {!credentials && (
                            <form className={styles.form} onSubmit={handleCreateCollege}>
                                <div className={styles.inputGroup}>
                                    <label>Institution Name</label>
                                    <input
                                        type="text"
                                        placeholder="University of Excellence"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Admin Name</label>
                                    <input
                                        type="text"
                                        placeholder="Dr. John Doe"
                                        value={formData.adminName}
                                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Admin Email</label>
                                    <input
                                        type="email"
                                        placeholder="admin@university.edu"
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Admin Password (min 8 characters)</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.adminPassword}
                                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>License Count</label>
                                    <input
                                        type="number"
                                        placeholder="1000"
                                        value={formData.licenseCount}
                                        onChange={(e) => setFormData({ ...formData, licenseCount: e.target.valueAsNumber || 0 })}
                                        required
                                        min={1}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Course Generation Limit</label>
                                    <input
                                        type="number"
                                        placeholder="50"
                                        value={formData.coursesLimit}
                                        onChange={(e) => setFormData({ ...formData, coursesLimit: e.target.valueAsNumber || 0 })}
                                        required
                                        min={1}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>License Expiry Date (Required)</label>
                                    <input
                                        type="date"
                                        value={formData.licenseExpiry}
                                        onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.modalActions}>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setShowAddCollege(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create College & Send Credentials'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Edit College Modal aka "Manage" */}
            {showEditCollege && selectedCollege && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`}>
                        <h2>Manage: {selectedCollege.name}</h2>

                        {/* Quick Overview */}
                        <div className={styles.statsGrid} style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div className={styles.statItem}>
                                <span className={styles.label}>Active Students</span>
                                <span className={styles.value}>{selectedCollege.studentCount || 0}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.label}>Active Teachers</span>
                                <span className={styles.value}>{selectedCollege.teachersCount || 0}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.label}>Courses</span>
                                <span className={styles.value}>{selectedCollege.coursesCount || 0}</span>
                            </div>
                        </div>

                        <form className={styles.form} onSubmit={handleEditCollege}>
                            <h3>License Settings</h3>
                            <div className={styles.groupGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={styles.inputGroup}>
                                    <label>License Count</label>
                                    <input
                                        type="number"
                                        value={formData.licenseCount}
                                        onChange={(e) => setFormData({ ...formData, licenseCount: parseInt(e.target.value) })}
                                        required
                                        min={selectedCollege.studentCount || 0}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Course Limit</label>
                                    <input
                                        type="number"
                                        value={formData.coursesLimit}
                                        onChange={(e) => setFormData({ ...formData, coursesLimit: parseInt(e.target.value) })}
                                        required
                                        min={1}
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Expiry Date</label>
                                <input
                                    type="date"
                                    value={formData.licenseExpiry}
                                    onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                                    required
                                />
                            </div>

                            <h3 style={{ marginTop: '1.5rem' }}>Administrator Credentials</h3>
                            <div className={styles.inputGroup}>
                                <label>Admin Name</label>
                                <input
                                    type="text"
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Admin Email</label>
                                <input
                                    type="email"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>New Password (Optional)</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep current"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                    minLength={8}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowEditCollege(false);
                                        setSelectedCollege(null);
                                    }}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
