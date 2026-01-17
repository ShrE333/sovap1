import { Course, StudentLearningState, Topic, ConfidenceLevel } from "../types";

export const ADAPTIVE_THRESHOLDS = {
    ADVANCE: 0.85,
    REINFORCE: 0.6,
    BACKTRACK: 0.4,
};

export function getNextTopic(state: StudentLearningState, course: Course): Topic | null {
    const allTopics = course.modules.flatMap(m => m.topics);

    // Find topics that haven't been mastered yet.
    const unmastered = allTopics.filter(t => !state.topicMastery[t.id]);

    if (unmastered.length === 0) return null; // Course completed

    // Simple heuristic: Take the first unmastered topic where prerequisites are met
    // and confidence is high enough.
    for (const topic of unmastered) {
        const confidence = state.topicConfidence[topic.id] || 0;

        // Check prerequisites
        const prereqsMet = topic.prerequisites.every(pId => state.topicMastery[pId]);

        if (prereqsMet) {
            if (confidence < ADAPTIVE_THRESHOLDS.BACKTRACK && state.topicConfidence[topic.id] !== undefined) {
                // This topic is too hard. We need to find "bridge" content or re-teach.
                // In a real RAG system, we'd query the vector DB for simpler explanations.
                // For now, return this topic but the UI will show "Basics Mode".
                return topic;
            }
            return topic;
        } else {
            // Prerequisites not met. Find the first unmet prerequisite.
            const unmetPrereqId = topic.prerequisites.find(pId => !state.topicMastery[pId]);
            if (unmetPrereqId) {
                return allTopics.find(t => t.id === unmetPrereqId) || null;
            }
        }
    }

    return unmastered[0];
}

export function updateStateAfterAttempt(
    state: StudentLearningState,
    topicId: string,
    confidence: ConfidenceLevel,
    score: number
): StudentLearningState {
    const newState = { ...state };
    newState.topicConfidence[topicId] = confidence;

    // Update mastery based on score and confidence
    if (score >= 0.8 && confidence >= ADAPTIVE_THRESHOLDS.ADVANCE) {
        newState.topicMastery[topicId] = true;
    } else {
        newState.topicMastery[topicId] = false;
    }

    newState.attemptHistory.push({
        topicId,
        timestamp: new Date().toISOString(),
        score,
        confidence
    });

    return newState;
}
