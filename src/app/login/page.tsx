'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(email, password);
            showToast('Welcome back! Redirecting...', 'success');
        } catch (err: any) {
            showToast(err.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            {/* Background Elements */}
            <div className={styles.authBackground}>
                <div className={styles.gradientOrb1}></div>
                <div className={styles.gradientOrb2}></div>
            </div>

            {/* Left Side - Branding */}
            <div className={styles.authBranding}>
                <Link href="/" className={styles.backButton}>
                    ← Back to Home
                </Link>

                <div className={styles.brandingContent}>
                    <h1 className={styles.brandLogo}>
                        <span className={styles.logoIcon}>🧠</span>
                        <span className="gradient-text">SOVAP</span>
                    </h1>
                    <p className={styles.brandTagline}>
                        AI-Powered Adaptive Learning
                    </p>
                    <div className={styles.brandStats}>
                        <div className={styles.brandStat}>
                            <div className={styles.brandStatNumber}>10K+</div>
                            <div className={styles.brandStatLabel}>Active Learners</div>
                        </div>
                        <div className={styles.brandStat}>
                            <div className={styles.brandStatNumber}>95%</div>
                            <div className={styles.brandStatLabel}>Success Rate</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className={styles.authFormSection}>
                <div className={`${styles.authCard} glass`}>
                    <div className={styles.authHeader}>
                        <h2>Welcome Back</h2>
                        <p>Sign in to continue your learning journey</p>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label>Email Address</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputIcon}>📧</span>
                                <input
                                    type="email"
                                    placeholder="name@college.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Password</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputIcon}>🔒</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className={styles.togglePassword}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className={styles.loadingBtn}>
                                    <span className={styles.spinner}></span>
                                    Authenticating...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        <p>
                            Don't have an account?
                            <Link href="/signup" className={styles.link}> Create one</Link>
                        </p>
                        <p className={styles.helpText}>
                            Need help? Contact your institution admin
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
