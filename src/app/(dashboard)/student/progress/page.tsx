'use client';

import { useLearningState } from '@/lib/contexts/LearningStateContext';
import styles from './progress.module.css';

export default function ProgressPage() {
    const { state } = useLearningState();

    if (!state) return <div>Loading progress...</div>;

    const masteredCount = Object.values(state.topicMastery).filter(Boolean).length;
    const confidenceAvg = Object.values(state.topicConfidence).length > 0
        ? (Object.values(state.topicConfidence).reduce((a, b) => a + b, 0) / Object.values(state.topicConfidence).length * 100).toFixed(0)
        : 0;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className="gradient-text">Academic Progress</h1>
                <p>Your performance driven by cognitive analysis.</p>
            </header>

            <div className={styles.statsGrid}>
                <div className="glass-card">
                    <h4>Mastery Level</h4>
                    <div className={styles.statLine}>{masteredCount} Topics Mastered</div>
                    <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${(masteredCount / 10) * 100}%` }}></div></div>
                </div>
                <div className="glass-card">
                    <h4>Overall Confidence</h4>
                    <div className={styles.statValue}>{confidenceAvg}%</div>
                    <p className={styles.subText}>AI Confidence Trend</p>
                </div>
            </div>

            <section className={`${styles.history} glass`}>
                <h3>Learning Activity</h3>
                <div className={styles.tableView}>
                    <div className={styles.rowHeader}>
                        <span>Topic</span>
                        <span>Date</span>
                        <span>Confidence</span>
                        <span>Status</span>
                    </div>
                    {state.attemptHistory.length === 0 && <p className={styles.empty}>No activity recorded yet.</p>}
                    {state.attemptHistory.map((item, i) => (
                        <div key={i} className={styles.itemRow}>
                            <span>{item.topicId}</span>
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            <span>{(item.confidence * 100).toFixed(0)}%</span>
                            <span className={styles.status}>{item.score >= 0.8 ? '✅ Passed' : '🔄 Reinforcing'}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
