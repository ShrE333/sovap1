'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

interface College {
    id: string;
    license_count: number;
    studentCount?: number;
}

export default function AdminPage() {
    const { user } = useAuth();
    const [colleges, setColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await apiCall('/api/admin/colleges');
            const data = await response.json();
            setColleges(data.colleges || []);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalLicenses = colleges.reduce((sum, c) => sum + c.license_count, 0);
    const totalStudents = colleges.reduce((sum, c) => sum + (c.studentCount || 0), 0);

    return (
        <div className={styles.adminContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className="gradient-text">Master System Control</h1>
                    <p>SOVAP Global Admin | {user?.name}</p>
                </div>
            </header>

            <div className={styles.overviewGrid}>
                <div className="glass-card">
                    <h4>Total Colleges</h4>
                    <div className={styles.statValue}>{colleges.length}</div>
                </div>
                <div className="glass-card">
                    <h4>Active Licenses</h4>
                    <div className={styles.statValue}>{totalLicenses.toLocaleString()}</div>
                </div>
                <div className="glass-card">
                    <h4>Enrolled Students</h4>
                    <div className={styles.statValue}>{totalStudents.toLocaleString()}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <Link href="/admin/colleges" className="glass-card hover-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3>🏛️ Manage Institutions</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Add new colleges, manage licenses, and oversee capacity.
                    </p>
                    <div className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Go to Colleges</div>
                </Link>

                <Link href="/admin/ai" className="glass-card hover-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3>🧠 AI Model Mesh</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Monitor LLM performance, token usage, and system health.
                    </p>
                    <div className="btn-secondary" style={{ display: 'inline-block', marginTop: '1rem' }}>View AI Stats</div>
                </Link>
            </div>
        </div>
    );
}
