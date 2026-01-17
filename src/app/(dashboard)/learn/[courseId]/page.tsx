'use client';

import { useLearningState } from '@/lib/contexts/LearningStateContext';
import { useState } from 'react';
import styles from './learn.module.css';
import LabComponent from '@/components/adaptive/LabComponent';

export default function LearnPage() {
    const { state, currentTopic, submitProgress, isLoading } = useLearningState();
    const [confidence, setConfidence] = useState(0.5);
    const [showQuiz, setShowQuiz] = useState(false);

    if (isLoading) return <div className="loader">Initializing Engine...</div>;
    if (!currentTopic) return <div className="completed">Course Completed! 🎉</div>;

    const handleNext = () => {
        // In a real app, this would be based on a quiz score
        // For demo, we assume 100% score if they click "Complete"
        submitProgress(currentTopic.id, confidence, 1.0);
        setShowQuiz(false);
        setConfidence(0.5);
    };

    return (
        <div className={styles.learnContainer}>
            <header className={styles.learnHeader}>
                <div className={styles.topicBadge}>Module: Introduction</div>
                <h1>{currentTopic.title}</h1>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${(Object.keys(state.topicMastery).length / 10) * 100}%` }}
                    />
                </div>
            </header>

            <div className={styles.mainLayout}>
                <section className={`${styles.content} glass`}>
                    <div className={styles.textContent}>
                        {currentTopic.content}
                        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                            <p><strong>Scenario:</strong> Imagine you are testing a banking application...</p>
                        </div>

                        {/* Show Lab if confidence is high or after reading */}
                        {confidence > 0.7 && (
                            <div className="animate-fade-in" style={{ marginTop: '3rem' }}>
                                <LabComponent labId={currentTopic.id} />
                            </div>
                        )}
                    </div>
                </section>

                <aside className={styles.controls}>
                    <div className="glass-card">
                        <h3>Intellectual Check</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            How well do you understand this concept?
                        </p>

                        <div className={styles.sliderContainer}>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={confidence}
                                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                                className={styles.slider}
                            />
                            <div className={styles.sliderLabels}>
                                <span>Lost</span>
                                <span>Confident</span>
                            </div>
                            <div className={styles.confidenceValue} style={{ color: confidence > 0.8 ? 'var(--success)' : confidence > 0.4 ? 'var(--warning)' : 'var(--error)' }}>
                                {(confidence * 100).toFixed(0)}% Confidence
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            onClick={() => setShowQuiz(true)}
                        >
                            Verify Understanding
                        </button>
                    </div>

                    <div className={`${styles.aiChat} glass`}>
                        <h3>Course Mentor</h3>
                        <div className={styles.chatBox}>
                            <div className={styles.message}>
                                <strong>AI:</strong> Based on your progress, you're doing great with <strong>{currentTopic.title}</strong>. Ask me anything about this topic!
                            </div>
                        </div>
                        <input type="text" placeholder="Ask AI..." className={styles.chatInput} />
                    </div>
                </aside>
            </div>

            {showQuiz && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`}>
                        <h2>Knowledge Verification</h2>
                        <p>To advance, solve this small challenge: What is the primary cause of IDOR?</p>
                        <div className={styles.options}>
                            <button className={styles.option}>Missing Authorization Check</button>
                            <button className={styles.option}>SQL Syntax Error</button>
                            <button className={styles.option}>Weak Password Policy</button>
                        </div>
                        <button className="btn-primary" onClick={handleNext}>Submit Response</button>
                    </div>
                </div>
            )}
        </div>
    );
}
