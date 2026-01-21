'use client';

import { useState } from 'react';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import styles from './settings.module.css';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form States
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [theme, setTheme] = useState('dark');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        marketing: false
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            showToast('Profile updated successfully', 'success');
            setLoading(false);
        }, 1000);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            showToast('Password changed successfully', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setLoading(false);
        }, 1000);
    };

    if (!user) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className="outfit">Account Settings</h1>
                <p className={styles.subtext}>Manage your profile, preferences, and security.</p>
            </header>

            <div className={styles.grid}>
                {/* Profile Section */}
                <section className={`${styles.card} glass`}>
                    <h3>Profile Information</h3>
                    <form onSubmit={handleUpdateProfile}>
                        <div className={styles.formGroup}>
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                disabled // Usually email is locked or requires verification
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Role</label>
                            <div className={styles.roleBadge}>{user.role.toUpperCase()}</div>
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </section>

                {/* Security Section */}
                <section className={`${styles.card} glass`}>
                    <h3>Security</h3>
                    <form onSubmit={handleChangePassword}>
                        <div className={styles.formGroup}>
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <button type="submit" className="btn-secondary" disabled={loading || !currentPassword}>
                            Update Password
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        <button onClick={logout} className="btn-secondary" style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
                            Sign Out of All Devices
                        </button>
                    </div>
                </section>

                {/* Preferences Section */}
                <section className={`${styles.card} glass`}>
                    <h3>Preferences</h3>

                    <div className={styles.settingRow}>
                        <div>
                            <label>Theme</label>
                            <p className={styles.settingDesc}>Choose your interface appearance.</p>
                        </div>
                        <select
                            value={theme}
                            onChange={(e) => {
                                setTheme(e.target.value);
                                showToast('Theme preference saved', 'info');
                            }}
                            className={styles.select}
                        >
                            <option value="dark">Deep Space (Dark)</option>
                            <option value="light">Nebula (Light)</option>
                            <option value="system">System Default</option>
                        </select>
                    </div>

                    <div className={styles.settingRow}>
                        <div>
                            <label>Email Notifications</label>
                            <p className={styles.settingDesc}>Receive updates about course progress.</p>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={notifications.email}
                                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.settingRow}>
                        <div>
                            <label>Sound Effects</label>
                            <p className={styles.settingDesc}>Play sounds on quiz completion.</p>
                        </div>
                        <label className={styles.switch}>
                            <input defaultChecked type="checkbox" />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                </section>
            </div>
        </div>
    );
}
