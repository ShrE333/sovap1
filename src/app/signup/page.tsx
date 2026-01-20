'use client';

import Link from 'next/link';
import styles from '../login/auth.module.css';
import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password, role: 'student' }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Signup failed');
            }

            showToast('Account created! Signing you in...', 'success');

            // After signup, automatically log in
            await login(email, password);
        } catch (err: any) {
            showToast(err.message || 'Signup failed', 'error');
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
                        Start Your Personalized Learning Journey
                    </p>

                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>✨</span>
                            <div>
                                <h3>Adaptive AI</h3>
                                <p>Content that evolves with you</p>
                            </div>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>🎯</span>
                            <div>
                                <h3>Personalized Path</h3>
                                <p>Your unique learning roadmap</p>
                            </div>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>🎓</span>
                            <div>
                                <h3>Verified Certificates</h3>
                                <p>Industry-recognized credentials</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className={styles.authFormSection}>
                <div className={`${styles.authCard} glass`}>
                    <div className={styles.authHeader}>
                        <h2>Create Your Account</h2>
                        <p>Join thousands of learners mastering new skills</p>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label>Full Name</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputIcon}>👤</span>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

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
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
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
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Must be at least 6 characters
                            </small>
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
                                    Creating Account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        <p>
                            Already have an account?
                            <Link href="/login" className={styles.link}> Sign in</Link>
                        </p>
                        <p className={styles.helpText}>
                            By signing up, you agree to our Terms & Privacy Policy
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
