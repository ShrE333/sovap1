'use client';

import { useLearningState } from '@/lib/contexts/LearningStateContext';
import styles from './progress.module.css';

export default function ProgressPage() {
    const { state } = useLearningState();

    if (!state) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading your progress analytics...</p>
            </div>
        );
    }

    const masteredCount = Object.values(state.topicMastery).filter(Boolean).length;
    const totalTopics = Object.keys(state.topicMastery).length || 10;
    const masteryPercentage = ((masteredCount / totalTopics) * 100).toFixed(0);

    const confidenceAvg = Object.values(state.topicConfidence).length > 0
        ? (Object.values(state.topicConfidence).reduce((a, b) => a + b, 0) / Object.values(state.topicConfidence).length * 100).toFixed(0)
        : 0;

    const recentActivity = state.attemptHistory.slice(-10).reverse();
    const totalAttempts = state.attemptHistory.length;
    const passedAttempts = state.attemptHistory.filter(a => a.score >= 0.8).length;
    const successRate = totalAttempts > 0 ? ((passedAttempts / totalAttempts) * 100).toFixed(0) : 0;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className="gradient-text">Learning Analytics</h1>
                    <p>Track your cognitive growth and mastery progression</p>
                </div>
                <div className={styles.headerBadge}>
                    <span className={styles.badgeIcon}>🎯</span>
                    <div>
                        <div className={styles.badgeLabel}>Current Streak</div>
                        <div className={styles.badgeValue}>7 Days</div>
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statIcon}>🏆</div>
                    <div className={styles.statContent}>
                        <h4>Mastery Level</h4>
                        <div className={styles.statValue}>{masteryPercentage}%</div>
                        <div className={styles.statSubtext}>{masteredCount} of {totalTopics} topics mastered</div>
                    </div>
                    <div className={styles.miniProgress}>
                        <div className={styles.miniProgressFill} style={{ width: `${masteryPercentage}%` }}></div>
                    </div>
                </div>

                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statIcon}>💡</div>
                    <div className={styles.statContent}>
                        <h4>Confidence Score</h4>
                        <div className={styles.statValue}>{confidenceAvg}%</div>
                        <div className={styles.statSubtext}>AI-measured certainty</div>
                    </div>
                    <div className={styles.confidenceIndicator}>
                        <div className={styles.confidenceDot} style={{ left: `${confidenceAvg}%` }}></div>
                    </div>
                </div>

                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statContent}>
                        <h4>Success Rate</h4>
                        <div className={styles.statValue}>{successRate}%</div>
                        <div className={styles.statSubtext}>{passedAttempts} passed / {totalAttempts} attempts</div>
                    </div>
                </div>

                <div className={`${styles.statCard} glass-card`}>
                    <div className={styles.statIcon}>⚡</div>
                    <div className={styles.statContent}>
                        <h4>Total Activity</h4>
                        <div className={styles.statValue}>{totalAttempts}</div>
                        <div className={styles.statSubtext}>Learning sessions</div>
                    </div>
                </div>
            </div>

            {/* Learning Activity Timeline */}
            <section className={`${styles.activitySection} glass`}>
                <div className={styles.sectionHeader}>
                    <h3>Recent Learning Activity</h3>
                    <span className={styles.activityCount}>{recentActivity.length} recent sessions</span>
                </div>

                {recentActivity.length === 0 ? (
                    <div className={styles.emptyActivity}>
                        <div className={styles.emptyIcon}>📊</div>
                        <p>No activity recorded yet. Start learning to see your progress!</p>
                    </div>
                ) : (
                    <div className={styles.activityList}>
                        {recentActivity.map((item, i) => {
                            const isPassed = item.score >= 0.8;
                            const confidenceLevel = item.confidence >= 0.8 ? 'high' : item.confidence >= 0.5 ? 'medium' : 'low';

                            return (
                                <div key={i} className={styles.activityItem}>
                                    <div className={styles.activityIndicator}>
                                        <div className={`${styles.activityDot} ${isPassed ? styles.dotSuccess : styles.dotWarning}`}></div>
                                        {i !== recentActivity.length - 1 && <div className={styles.activityLine}></div>}
                                    </div>

                                    <div className={styles.activityContent}>
                                        <div className={styles.activityHeader}>
                                            <span className={styles.activityTopic}>{item.topicId}</span>
                                            <span className={styles.activityDate}>
                                                {new Date(item.timestamp).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        <div className={styles.activityMetrics}>
                                            <div className={styles.metric}>
                                                <span className={styles.metricLabel}>Score:</span>
                                                <span className={`${styles.metricValue} ${isPassed ? styles.success : styles.warning}`}>
                                                    {(item.score * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className={styles.metric}>
                                                <span className={styles.metricLabel}>Confidence:</span>
                                                <span className={`${styles.metricValue} ${styles[confidenceLevel]}`}>
                                                    {(item.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className={styles.statusBadge}>
                                                {isPassed ? '✅ Mastered' : '🔄 Needs Review'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Mastered Topics */}
            {masteredCount > 0 && (
                <section className={`${styles.masteredSection} glass`}>
                    <h3>🎓 Mastered Topics</h3>
                    <div className={styles.topicGrid}>
                        {Object.entries(state.topicMastery)
                            .filter(([_, mastered]) => mastered)
                            .map(([topicId, _], i) => (
                                <div key={i} className={styles.topicBadge}>
                                    <span className={styles.topicCheck}>✓</span>
                                    {topicId}
                                </div>
                            ))}
                    </div>
                </section>
            )}
        </div>
    );
}
