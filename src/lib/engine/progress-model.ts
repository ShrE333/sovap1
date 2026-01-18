/**
 * Phase 8: Student Progress Model
 * Deep tracking of student cognitive patterns, failures, and mastery.
 */

export interface StudentProgressModel {
    studentId: string;
    courseId: string;

    // Cognitive Stats
    overallConfidence: number;      // 0.0 to 1.0
    masteryScore: number;           // Calculated across all modules

    // Detailed Mapping
    completedTopics: string[];      // List of Topic IDs
    failedLabs: string[];           // Labs needing RAG re-teaching

    // The "Heatmap" of learning
    confidenceMap: Record<string, number[]>; // topicId -> last 3 confidence scores

    // Progress for Phase 6 MCQ Engine
    baselineResults: {
        topicId: string;
        tag: 'MASTER' | 'GUESS' | 'UNKNOWN' | 'MISCONCEPTION';
    }[];
}

export function updateConfidenceHeatmap(history: number[], newScore: number): number[] {
    const updated = [...history, newScore];
    if (updated.length > 3) return updated.slice(-3); // Keep last 3 for trend analysis
    return updated;
}
