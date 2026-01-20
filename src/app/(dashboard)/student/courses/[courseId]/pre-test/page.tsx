'use client';

import { useState, useEffect } from 'react';
import { useAuth, apiCall } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useParams, useRouter } from 'next/navigation';

interface Question {
    id: string;
    question: string;
    options: string[];
}

export default function PreTestPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const courseId = params.courseId as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<any[]>([]);
    const [confidence, setConfidence] = useState(3);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadPreTest();
    }, []);

    const loadPreTest = async () => {
        try {
            const res = await apiCall(`/api/courses/${courseId}/pre-test`);
            const data = await res.json();
            setQuestions(data.questions || []);
        } catch (error) {
            console.error('Failed to load pre-test:', error);
            showToast('Failed to load assessment', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (selectedOption === null) return;

        const currentAnswer = {
            questionId: questions[currentIndex].id,
            answerIndex: selectedOption,
            confidence: confidence
        };

        const newAnswers = [...answers, currentAnswer];
        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(null);
            setConfidence(3);
        } else {
            submitResults(newAnswers);
        }
    };

    const submitResults = async (finalAnswers: any[]) => {
        setSubmitting(true);
        try {
            const res = await apiCall(`/api/courses/${courseId}/pre-test`, {
                method: 'POST',
                body: JSON.stringify({ answers: finalAnswers })
            });

            if (res.ok) {
                const data = await res.json();
                showToast('Diagnostic Complete! Roadmap Generated.', 'success');
                // In real app, redirect to the learning path
                router.push(`/learn/${courseId}`);
            } else {
                showToast('Failed to submit results. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Submission failed:', error);
            showToast('Submission failed. Please check your connection.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '2rem', maxWidth: '800px' }}>
                <LoadingSkeleton type="text" count={1} />
                <div style={{ marginTop: '2rem' }}>
                    <LoadingSkeleton type="card" count={1} />
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="container" style={{ padding: '2rem', maxWidth: '800px', textAlign: 'center' }}>
                <h2>No Assessment Available</h2>
                <p>This course does not have a pre-test configured.</p>
                <button className="btn-primary" onClick={() => router.push(`/learn/${courseId}`)} style={{ marginTop: '1rem' }}>
                    Go to Course
                </button>
            </div>
        );
    }

    if (submitting) {
        return (
            <div className="container" style={{ padding: '2rem', maxWidth: '800px', textAlign: 'center' }}>
                <h2>🚀 Generating your adaptive roadmap...</h2>
                <p>Analyzing your knowledge gaps and strengths.</p>
                <div style={{ marginTop: '2rem' }}>
                    <LoadingSkeleton type="text" count={3} />
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '800px' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="gradient-text" style={{ fontWeight: 'bold' }}>Diagnostic Assessment</span>
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                </div>

                <h2 style={{ marginBottom: '2rem' }}>{currentQuestion.question}</h2>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedOption(idx)}
                            style={{
                                padding: '1rem',
                                textAlign: 'left',
                                background: selectedOption === idx ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: selectedOption === idx ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        How confident are you in this answer? (1 = Guess, 5 = Absolute Certainty)
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem' }}>1</span>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={confidence}
                            onChange={(e) => setConfidence(parseInt(e.target.value))}
                            style={{ flex: 1, accentColor: 'var(--accent)' }}
                        />
                        <span style={{ fontSize: '0.8rem' }}>5</span>
                        <span style={{ fontWeight: 'bold', minWidth: '20px' }}>{confidence}</span>
                    </div>
                </div>

                <button
                    className="btn-primary"
                    style={{ marginTop: '2rem', width: '100%', padding: '1rem' }}
                    disabled={selectedOption === null}
                    onClick={handleNext}
                >
                    {currentIndex === questions.length - 1 ? 'Finish & Generate Roadmap' : 'Next Question'}
                </button>
            </div>

            <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                * Your roadmap will be dynamically re-routed based on the gap between your score and confidence.
            </p>
        </div>
    );
}
