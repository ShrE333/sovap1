'use client';

import Link from 'next/link';
import styles from '../login/auth.module.css';
import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would create a user in Supabase/Postgres
        // For now, we just log them in as a student
        login(email, 'password');
    };

    return (
        <div className={styles.authContainer}>
            <div className={`${styles.authCard} glass`}>
                <h1 className="gradient-text">Create Account</h1>
                <p>Join the next generation of AI-powered learners.</p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label>Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
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
                        <label>Admission Code (Optional)</label>
                        <input type="text" placeholder="Provided by College" />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                        Create Account
                    </button>
                </form>

                <p className={styles.switch}>
                    Already have an account? <Link href="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}
