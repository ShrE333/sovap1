'use client';

import { useState } from 'react';
import styles from '../admin.module.css';

export default function AdminAIPage() {
    const [modelStats] = useState({
        modelName: 'Gemma-2 9B (Quantized)',
        provider: 'Local / Self-Hosted',
        status: 'Online',
        uptime: '24d 13h',
        totalRequests: 1245890,
        tokensGenerated: 543000000,
        avgLatency: '45ms',
        cost: '$0.00 (Self-Hosted)',
    });

    const [usageHistory] = useState([
        { type: 'Course Generation', count: 120, tokens: '14.5M' },
        { type: 'Lab Environment', count: 4500, tokens: '89.2M' },
        { type: 'Teacher Chatbot', count: 8900, tokens: '12.1M' },
        { type: 'Student Adaptive Engine', count: 154000, tokens: '240M' },
    ]);

    return (
        <div className={styles.adminContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className="gradient-text">AI Model Mesh</h1>
                    <p>System Intelligence Monitor</p>
                </div>
                <div className={`${styles.badge} ${styles.active}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                    ● System Healthy
                </div>
            </header>

            <div className={styles.overviewGrid}>
                <div className="glass-card">
                    <h4>Total Tokens</h4>
                    <div className={styles.statValue}>543M</div>
                    <div className={styles.subText}>Since deployment</div>
                </div>
                <div className="glass-card">
                    <h4>Requests/Sec</h4>
                    <div className={styles.statValue}>48</div>
                    <div className={styles.subText}>Peak: 120</div>
                </div>
                <div className="glass-card">
                    <h4>Avg. Latency</h4>
                    <div className={styles.statValue}>45ms</div>
                    <div className={styles.subText}>Optimized (Int8)</div>
                </div>
            </div>

            <section className={`${styles.panel} glass`}>
                <div className={styles.panelHeader}>
                    <h3>Primary Model Configuration</h3>
                </div>

                <div className={styles.collegeCard} style={{ display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{modelStats.modelName}</div>
                        <div className={`${styles.badge} ${styles.active}`}>{modelStats.status}</div>
                    </div>

                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.label}>Provider</span>
                            <span className={styles.value}>{modelStats.provider}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.label}>Uptime</span>
                            <span className={styles.value}>{modelStats.uptime}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.label}>Context Window</span>
                            <span className={styles.value}>128k</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.label}>Inference Device</span>
                            <span className={styles.value}>NVIDIA H100 (Simulated)</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className={`${styles.panel} glass`} style={{ marginTop: '2rem' }}>
                <div className={styles.panelHeader}>
                    <h3>Usage by Feature</h3>
                </div>
                <div className={styles.list}>
                    {usageHistory.map((item, idx) => (
                        <div key={idx} className={styles.collegeCard}>
                            <div className={styles.collegeInfo}>
                                <strong>{item.type}</strong>
                            </div>
                            <div className={styles.statsGrid}>
                                <div className={styles.statItem}>
                                    <span className={styles.label}>Requests</span>
                                    <span className={styles.value}>{item.count.toLocaleString()}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.label}>Tokens</span>
                                    <span className={styles.value}>{item.tokens}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
