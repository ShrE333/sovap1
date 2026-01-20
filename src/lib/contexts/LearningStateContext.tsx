'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StudentLearningState, Topic, Course } from '../types';
import { getNextTopic, updateStateAfterAttempt } from '../engine/adaptive-logic';

interface LearningContextType {
    state: StudentLearningState | null;
    currentCourse: Course | null;
    currentTopic: Topic | null;
    submitProgress: (topicId: string, confidence: number, score: number) => void;
    initializeCourse: (courseId: string) => Promise<void>;
    isLoading: boolean;
    setCurrentTopic: (topic: Topic) => void;
}

const LearningStateContext = createContext<LearningContextType | undefined>(undefined);

const GITHUB_STORAGE_BASE = "https://raw.githubusercontent.com/ShrE333/sovap1/main";

export function LearningStateProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<StudentLearningState | null>(null);
    const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
    const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const initializeCourse = async (courseId: string) => {
        setIsLoading(true);
        try {
            let course: Course | null = null;

            // Fetch from Internal Proxy (handles Private GitHub Repos)
            try {
                // Use helper to ensure Authorization header is attached
                const token = sessionStorage.getItem('sovap_token');
                const headers: Record<string, string> = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(`/api/courses/${courseId}/content`, { headers });

                if (response.ok) {
                    course = await response.json();
                } else {
                    console.error("Course fetch failed:", response.status, response.statusText);
                }
            } catch (e) {
                console.error("Failed to fetch course api:", e);
            }

            if (!course) {
                console.error(`Course ${courseId} not found. No fallback available.`);
                setIsLoading(false);
                return;
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


    const submitProgress = async (topicId: string, confidence: number, score: number) => {
        if (!state || !currentCourse) return;

        const newState = updateStateAfterAttempt(state, topicId, confidence, score);
        setState(newState);
        localStorage.setItem(`sovap_state_${state.courseId}`, JSON.stringify(newState));

        // Calculate next topic
        const nextTopic = getNextTopic(newState, currentCourse);
        setCurrentTopic(nextTopic);

        // Sync progress to server
        try {
            const totalTopics = currentCourse.modules.reduce((acc, m) => acc + (m.topics?.length || 1), 0);
            const masteredCount = Object.keys(newState.topicMastery).length;
            const progressPercent = Math.min(100, Math.round((masteredCount / totalTopics) * 100));

            const token = sessionStorage.getItem('sovap_token');
            if (token) {
                await fetch('/api/enrollments/update', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        courseId: state.courseId,
                        progress: progressPercent,
                        currentTopic: nextTopic?.id || null
                    })
                });
            }
        } catch (error) {
            console.error('Failed to sync progress to server:', error);
            // Don't block the UI if sync fails
        }
    };


    return (
        <LearningStateContext.Provider value={{
            state,
            currentCourse,
            currentTopic,
            submitProgress,
            initializeCourse,
            isLoading,
            setCurrentTopic // Exposed for sidebar navigation
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
