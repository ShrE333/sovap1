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
    const [dbStatus, setDbStatus] = useState<any>(null);

    useEffect(() => {
        loadStats();
        apiCall('/api/admin/db-status')
            .then(res => res.json())
            .then(data => setDbStatus(data))
            .catch(err => console.error('DB Check failed:', err));
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

    const collegesArray = Array.isArray(colleges) ? colleges : [];
    const totalLicenses = collegesArray.reduce((sum, c) => sum + (c?.license_count || 0), 0);
    const totalStudents = collegesArray.reduce((sum, c) => sum + (c?.studentCount || 0), 0);

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

            <section className="glass-card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>🔌 System Integration Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className={styles.statItem}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Database Mode</span>
                        <span style={{ color: dbStatus?.mode === 'Supabase' ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
                            {dbStatus?.mode || 'Loading...'}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Connection Status</span>
                        <span style={{
                            color: dbStatus?.connectionStatus === 'Connected' ? 'var(--success)' : 'var(--error)',
                            fontWeight: 'bold'
                        }}>
                            {dbStatus?.connectionStatus || 'Checking...'}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>URL Endpoint</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            {dbStatus?.url || '---'}
                        </span>
                    </div>
                </div>
                {dbStatus?.diagnostic && (
                    <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,0,0,0.1)', borderRadius: '4px', border: '1px solid rgba(255,0,0,0.2)' }}>
                        <code style={{ fontSize: '0.75rem' }}>{JSON.stringify(dbStatus.diagnostic)}</code>
                    </div>
                )}
            </section>

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
