'use client';

import Link from 'next/link';
import styles from './auth.module.css';
import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '3rem', letterSpacing: '-2px', lineHeight: 1 }}>
                        <span style={{ color: 'var(--accent-primary)' }}>SOVAP</span>
                    </h1>
                    <div style={{ height: '4px', width: '40px', background: 'var(--accent-secondary)', margin: '0.5rem auto', borderRadius: '2px' }}></div>
                </div>
                <h2 className="outfit" style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Cognitive Access</h2>
                <p>Synchronize with your adaptive learning environment.</p>

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@college.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className={styles.switch}>
                    Don't have an account? Contact your institution admin.
                </p>
            </div>
        </div>
    );
}
