
'use client';

import React, { useState, useEffect } from 'react';
import { useLearningState } from '@/lib/contexts/LearningStateContext';
import styles from './learn.module.css';
import LabComponent from '@/components/adaptive/LabComponent';
import AdaptiveQuiz from '@/components/adaptive/AdaptiveQuiz';
import { selectDynamicMCQs } from '@/lib/engine/mcq-engine';
import { owaspCourse } from '@/lib/data/owasp-course';

export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = React.use(params);
    const { state, currentTopic, submitProgress, isLoading } = useLearningState();
    const [confidence, setConfidence] = useState(0.5);
    const [showQuiz, setShowQuiz] = useState(false);
    const [selectedMCQs, setSelectedMCQs] = useState<any[]>([]);

    useEffect(() => {
        if (showQuiz && currentTopic) {
            // Find current module
            const module = owaspCourse.modules.find(m => m.topics.some(t => t.id === currentTopic.id));
            if (module && module.mcqs.length > 0) {
                const stateForEngine = {
                    masteryTags: {}, // Should pull from Baseline in real app
                    recentConfidence: []
                };
                const picked = selectDynamicMCQs(module.mcqs, stateForEngine, 1); // 1 for demo, 30 for prod
                setSelectedMCQs(picked);
            }
        }
    }, [showQuiz, currentTopic]);

    if (isLoading) return <div className="loader">Initializing Engine...</div>;
    if (!currentTopic) return <div className="completed">Course Completed! 🎉</div>;

    const handleQuizComplete = (score: number, avgConfidence: number) => {
        // Normalize 1-5 confidence to 0-1 for the engine
        const normalizedConfidence = avgConfidence / 5;
        submitProgress(currentTopic.id, normalizedConfidence, score);
        setShowQuiz(false);
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

                        {/* Phase 7: Lab Gating Logic */}
                        {(state.topicMastery[currentTopic.id] || false) ? (
                            <div className="animate-fade-in" style={{ marginTop: '3rem' }}>
                                <div style={{ marginBottom: '1rem', padding: '0.8rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)', fontSize: '0.9rem' }}>
                                    ✨ Mastery Verified: Lab Unlocked
                                </div>
                                <LabComponent labId={currentTopic.id} />
                            </div>
                        ) : (
                            <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)' }}>🔒 Hands-on Lab is locked.</p>
                                <p style={{ fontSize: '0.8rem' }}>Complete the <strong>Knowledge Verification</strong> with high confidence to unlock.</p>
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
                    <div className={`${styles.modal} glass`} style={{ maxWidth: '800px', width: '90%' }}>
                        <h2>Knowledge Verification</h2>
                        {selectedMCQs.length > 0 ? (
                            <AdaptiveQuiz
                                mcqs={selectedMCQs}
                                onComplete={handleQuizComplete}
                            />
                        ) : (
                            <div>
                                <p>Calculating adaptive questions...</p>
                                <button className="btn-secondary" onClick={() => setShowQuiz(false)}>Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
