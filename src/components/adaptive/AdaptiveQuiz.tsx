
'use client';

import React, { useState, useEffect } from 'react';
import { MCQ } from '@/lib/types';
import styles from './AdaptiveQuiz.module.css';

interface AdaptiveQuizProps {
    mcqs: MCQ[];
    onComplete: (score: number, confidenceAvg: number) => void;
}

export default function AdaptiveQuiz({ mcqs, onComplete }: AdaptiveQuizProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [confidence, setConfidence] = useState(3);
    const [showExplanation, setShowExplanation] = useState(false);
    const [results, setResults] = useState<{ score: number; confidence: number }[]>([]);

    const currentMCQ = mcqs[currentIndex];

    const handleNext = () => {
        if (selectedOption === null) return;

        const isCorrect = selectedOption === currentMCQ.correctIndex;
        const newResults = [...results, { score: isCorrect ? 1 : 0, confidence }];
        setResults(newResults);

        if (!showExplanation) {
            setShowExplanation(true);
        } else {
            if (currentIndex < mcqs.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setSelectedOption(null);
                setConfidence(3);
                setShowExplanation(false);
            } else {
                const totalScore = newResults.reduce((acc, r) => acc + r.score, 0);
                const avgConfidence = newResults.reduce((acc, r) => acc + r.confidence, 0) / newResults.length;
                onComplete(totalScore / mcqs.length, avgConfidence);
            }
        }
    };

    if (!currentMCQ) return <div>No Questions Available</div>;

    return (
        <div className={styles.quizWrapper}>
            <div className={styles.progressHeader}>
                <span>Question {currentIndex + 1} of {mcqs.length}</span>
                <div className={styles.progBar}>
                    <div className={styles.progFill} style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }} />
                </div>
            </div>

            <div className={styles.questionCard}>
                <h3 className={styles.questionText}>{currentMCQ.question}</h3>

                <div className={styles.optionsGrid}>
                    {currentMCQ.options.map((option, idx) => (
                        <button
                            key={idx}
                            disabled={showExplanation}
                            onClick={() => setSelectedOption(idx)}
                            className={`${styles.optionBtn} ${selectedOption === idx ? styles.selected : ''
                                } ${showExplanation && idx === currentMCQ.correctIndex ? styles.correct : ''
                                } ${showExplanation && selectedOption === idx && idx !== currentMCQ.correctIndex ? styles.incorrect : ''
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {!showExplanation && (
                    <div className={styles.confidenceSection}>
                        <p>Confidence Level: <strong>{confidence}</strong></p>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            value={confidence}
                            onChange={(e) => setConfidence(parseInt(e.target.value))}
                            className={styles.slider}
                        />
                        <div className={styles.sliderLabels}>
                            <span>Guessing</span>
                            <span>Certain</span>
                        </div>
                    </div>
                )}

                {showExplanation && (
                    <div className={`${styles.explanation} animate-fade-in`}>
                        <p><strong>{selectedOption === currentMCQ.correctIndex ? '✅ Correct!' : '❌ Incorrect'}</strong></p>
                        <p>{currentMCQ.explanation}</p>
                    </div>
                )}

                <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '2rem' }}
                    disabled={selectedOption === null}
                    onClick={handleNext}
                >
                    {showExplanation ? (currentIndex === mcqs.length - 1 ? 'Finish Assessment' : 'Next Question') : 'Verify Answer'}
                </button>
            </div>
        </div>
    );
}
