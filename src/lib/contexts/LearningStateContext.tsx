'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StudentLearningState, Topic, Course } from '../types';
import { getNextTopic, updateStateAfterAttempt } from '../engine/adaptive-logic';
import { owaspCourse } from '../data/owasp-course';

interface LearningContextType {
    state: StudentLearningState;
    currentTopic: Topic | null;
    submitProgress: (topicId: string, confidence: number, score: number) => void;
    isLoading: boolean;
}

const LearningStateContext = createContext<LearningContextType | undefined>(undefined);

export function LearningStateProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<StudentLearningState | null>(null);
    const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);

    useEffect(() => {
        // Load state from localStorage or create default
        const saved = localStorage.getItem(`sovap_state_${owaspCourse.id}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            setState(parsed);
            setCurrentTopic(getNextTopic(parsed, owaspCourse));
        } else {
            const initialState: StudentLearningState = {
                studentId: 'user-1',
                courseId: owaspCourse.id,
                topicConfidence: {},
                topicMastery: {},
                attemptHistory: [],
                labStatus: {},
                lastActive: new Date().toISOString(),
                currentPath: [],
            };
            setState(initialState);
            setCurrentTopic(getNextTopic(initialState, owaspCourse));
        }
    }, []);

    const submitProgress = (topicId: string, confidence: number, score: number) => {
        if (!state) return;

        const newState = updateStateAfterAttempt(state, topicId, confidence, score);
        setState(newState);
        localStorage.setItem(`sovap_state_${owaspCourse.id}`, JSON.stringify(newState));

        // Calculate next topic
        setCurrentTopic(getNextTopic(newState, owaspCourse));
    };

    return (
        <LearningStateContext.Provider value={{
            state: state || {} as any,
            currentTopic,
            submitProgress,
            isLoading: !state
        }}>
            {children}
        </LearningStateContext.Provider>
    );
}

export function useLearningState() {
    const context = useContext(LearningStateContext);
    if (context === undefined) {
        throw new Error('useLearningState must be used within a LearningStateProvider');
    }
    return context;
}
