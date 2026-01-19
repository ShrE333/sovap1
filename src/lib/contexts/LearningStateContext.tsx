'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StudentLearningState, Topic, Course } from '../types';
import { getNextTopic, updateStateAfterAttempt } from '../engine/adaptive-logic';
import { owaspCourse } from '../data/owasp-course';

interface LearningContextType {
    state: StudentLearningState | null;
    currentCourse: Course | null;
    currentTopic: Topic | null;
    submitProgress: (topicId: string, confidence: number, score: number) => void;
    initializeCourse: (courseId: string) => Promise<void>;
    isLoading: boolean;
}

const LearningStateContext = createContext<LearningContextType | undefined>(undefined);

const GITHUB_STORAGE_BASE = "https://raw.githubusercontent.com/ShrE333/sovap-course-storage/main";

export function LearningStateProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<StudentLearningState | null>(null);
    const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
    const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const initializeCourse = async (courseId: string) => {
        setIsLoading(true);
        try {
            let course: Course | null = null;

            // 1. Check if it's the mock course
            if (courseId === 'owasp-top-10' || courseId === 'OWASP-TOP-10') {
                course = owaspCourse;
            } else {
                // 2. Try to fetch from GitHub
                try {
                    const response = await fetch(`${GITHUB_STORAGE_BASE}/courses/${courseId}/master.json`);
                    if (response.ok) {
                        course = await response.json();
                    }
                } catch (e) {
                    console.error("Failed to fetch course from GitHub:", e);
                }
            }

            if (!course) {
                // Fallback to OWASP for demo if nothing else found
                course = owaspCourse;
            }

            setCurrentCourse(course);

            // 3. Load state
            const saved = localStorage.getItem(`sovap_state_${courseId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                setState(parsed);
                setCurrentTopic(getNextTopic(parsed, course));
            } else {
                const initialState: StudentLearningState = {
                    studentId: 'user-1', // Should come from Auth
                    courseId: courseId,
                    topicConfidence: {},
                    topicMastery: {},
                    attemptHistory: [],
                    labStatus: {},
                    lastActive: new Date().toISOString(),
                    currentPath: [],
                };
                setState(initialState);
                setCurrentTopic(getNextTopic(initialState, course));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const submitProgress = (topicId: string, confidence: number, score: number) => {
        if (!state || !currentCourse) return;

        const newState = updateStateAfterAttempt(state, topicId, confidence, score);
        setState(newState);
        localStorage.setItem(`sovap_state_${state.courseId}`, JSON.stringify(newState));

        // Calculate next topic
        setCurrentTopic(getNextTopic(newState, currentCourse));
    };

    return (
        <LearningStateContext.Provider value={{
            state,
            currentCourse,
            currentTopic,
            submitProgress,
            initializeCourse,
            isLoading
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
