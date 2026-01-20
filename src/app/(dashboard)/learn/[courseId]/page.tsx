'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useLearningState } from '@/lib/contexts/LearningStateContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import styles from './learn.module.css';
import LabComponent from '@/components/adaptive/LabComponent';
import AdaptiveQuiz from '@/components/adaptive/AdaptiveQuiz';
import { selectDynamicMCQs } from '@/lib/engine/mcq-engine';

export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = React.use(params);
    const router = useRouter();
    const { showToast } = useToast();
    const { state, currentCourse, currentTopic, submitProgress, initializeCourse, isLoading } = useLearningState();
    const [confidence, setConfidence] = useState(0.5);
    const [showQuiz, setShowQuiz] = useState(false);
    const [selectedMCQs, setSelectedMCQs] = useState<any[]>([]);

    useEffect(() => {
        if (courseId) {
            initializeCourse(courseId);
        }
    }, [courseId]);

    useEffect(() => {
        if (showQuiz && currentTopic && currentCourse) {
            let foundQuestions: any[] = [];

            // Find current module safely
            const module = currentCourse.modules.find(m =>
                (m.topics && m.topics.some(t => t.id === currentTopic.id)) ||
                m.id === currentTopic.id ||
                m.title === currentTopic.title
            );

            if (module && module.mcqs && module.mcqs.length > 0) {
                const stateForEngine = {
                    masteryTags: {},
                    recentConfidence: []
                };
                foundQuestions = selectDynamicMCQs(module.mcqs, stateForEngine, 1);
            }

            // Apply selection or fallback
            if (foundQuestions.length > 0) {
                setSelectedMCQs(foundQuestions);
            } else {
                // If no MCQs in this module (or AI course), generate a generic adaptive check
                setSelectedMCQs([{
                    id: 'adaptive-check',
                    question: `Adaptive Check: Do you feel ready to advance in "${currentTopic.title}"?`,
                    options: ['Yes, absolutely', 'I need more practice'],
                    correctIndex: 0,
                    difficulty: 'basic',
                    explanation: 'Self-assessment is a key part of the learning loop.'
                }]);
            }
        }
    }, [showQuiz, currentTopic, currentCourse]);

    if (isLoading || !state) {
        return (
            <div className={styles.learnContainer}>
                <header className={styles.learnHeader}>
                    <LoadingSkeleton type="text" count={2} />
                </header>
                <div className={styles.mainLayout}>
                    <section className={`${styles.content} glass`}>
                        <LoadingSkeleton type="text" count={6} />
                    </section>
                    <aside className={styles.controls}>
                        <div className={`${styles.glassCard}`}>
                            <LoadingSkeleton type="card" count={1} />
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    // Check if course has modules
    if (!currentCourse?.modules || currentCourse.modules.length === 0) {
        return (
            <div className={styles.mainLayout} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div className={`${styles.glassCard}`} style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>⚠️ No Content Available</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                        This intelligence unit is currently empty.
                        <br />It may have failed generation or is pending content injection.
                    </p>
                    <button className="btn-secondary" onClick={() => router.back()} style={{ marginTop: '2rem' }}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!currentTopic) {
        return (
            <div className="completed" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉 Course Completed!</h1>
                <p className="text-xl text-center mb-8">You have mastered all available topics.</p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        className="btn-primary"
                        onClick={async () => {
                            showToast('Generating certificate...', 'info');
                            try {
                                const response = await fetch(`/api/certificates/generate?courseId=${courseId}`, {
                                    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('sovap_token')}` }
                                });
                                if (!response.ok) throw new Error('Download failed');

                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.style.display = 'none';
                                a.href = url;
                                a.download = `Certificate_${currentCourse?.title?.replace(/\s+/g, '_') || 'Course'}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                showToast('Certificate downloaded!', 'success');
                            } catch (e) {
                                console.error(e);
                                showToast('Failed to download certificate', 'error');
                            }
                        }}
                    >
                        📜 Download Certificate
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={() => {
                            if (confirm('Reset all progress for this course?')) {
                                localStorage.removeItem(`sovap_state_${courseId}`);
                                window.location.reload();
                            }
                        }}
                    >
                        Reset Progress & Restart
                    </button>

                    <button className="btn-secondary" onClick={() => router.push('/student')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const handleQuizComplete = (score: number, avgConfidence: number) => {
        // Normalize 1-5 confidence to 0-1 for the engine
        const normalizedConfidence = avgConfidence / 5;
        submitProgress(currentTopic.id, normalizedConfidence, score);
        setShowQuiz(false);
        showToast('Progress recorded. Adapting path...', 'success');
    };

    // Calculate progress helper
    const calculateTotalTopics = () => {
        return currentCourse.modules.reduce((acc, m) => acc + (m.topics?.length || 1), 0);
    };

    const totalTopics = calculateTotalTopics();
    const masteredCount = Object.keys(state.topicMastery).length;
    const progressPercent = Math.min(100, (masteredCount / totalTopics) * 100);

    return (
        <div className={styles.learnContainer}>
            <header className={styles.learnHeader}>
                <div className={`${styles.topicBadge} animate-slide-up`}>
                    Unit: {currentCourse?.modules.find(m =>
                        (m.topics && m.topics.some(t => t.id === currentTopic.id)) || m.title === currentTopic.title
                    )?.title || 'Learning'}
                </div>
                <h1 className="outfit animate-slide-up" style={{ animationDelay: '0.1s' }}>{currentTopic.title}</h1>
                <div className={`${styles.progressBar} animate-slide-up`} style={{ animationDelay: '0.2s' }}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </header>

            <div className={styles.mainLayout}>
                <section className={`${styles.content} glass`}>
                    <div className={styles.markdownContent}>
                        <ReactMarkdown>{currentTopic.content}</ReactMarkdown>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <p><strong>Scenario:</strong> Apply this concept to a real-world problem.</p>
                    </div>

                    {/* Lab Gating Logic */}
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
                </section>

                <aside className={styles.controls}>
                    <div className={`${styles.glassCard} animate-slide-up`} style={{ animationDelay: '0.3s' }}>
                        <h3 className={styles.chatTitle}>Knowledge Verification</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            Update your certainty level for the cognitive engine.
                        </p>

                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={confidence}
                            onChange={(e) => setConfidence(parseFloat(e.target.value))}
                            className={styles.slider}
                        />
                        <div className={styles.confidenceValue}>
                            {(confidence * 100).toFixed(0)}% <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>Certainty</span>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            onClick={() => setShowQuiz(true)}
                        >
                            Verify Understanding
                        </button>
                    </div>

                    <div className={`${styles.glassCard} ${styles.aiChat} animate-slide-up`} style={{ animationDelay: '0.4s' }}>
                        <h3 className={styles.chatTitle}>Intelligence Feed</h3>
                        <div className={styles.chatBox}>
                            <div className={styles.message}>
                                🤖 SOVAP Assistant: You're currently analyzing <strong>{currentTopic.title}</strong>. Ask me anything to refine your mental model.
                            </div>
                        </div>
                        <input type="text" placeholder="Query cognitive mentor..." className={styles.chatInput} />
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
