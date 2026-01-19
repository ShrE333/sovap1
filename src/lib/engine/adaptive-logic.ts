import { Course, StudentLearningState, Topic, ConfidenceLevel } from "../types";

export const ADAPTIVE_THRESHOLDS = {
    ADVANCE: 0.85,
    REINFORCE: 0.6,
    BACKTRACK: 0.4,
};

export function getNextTopic(state: StudentLearningState, course: Course): Topic | null {
    // For AI-generated courses, modules don't have a 'topics' array
    // Instead, we treat each module itself as a "topic" for learning progression

    let allTopics: Topic[] = [];

    // Check if course has traditional topic structure
    const hasTopics = course.modules.some(m => m.topics && m.topics.length > 0);

    if (hasTopics) {
        // Traditional course with topics
        allTopics = course.modules.flatMap(m => m.topics || []);
    } else {
        // AI-generated course - create synthetic topics from modules
        allTopics = course.modules.map((module, idx) => ({
            id: module.id || `module-${idx}`,
            title: module.title,
            description: (module as any).theory?.substring(0, 200) || '',
            content: (module as any).theory || '',
            prerequisites: idx > 0 ? [module.id || `module-${idx - 1}`] : [],
            estimatedTime: 45 // Default 45 minutes per module
        }));
    }

    if (allTopics.length === 0) {
        // No topics at all - course is empty
        return null;
    }

    // Find topics that haven't been mastered yet
    const unmastered = allTopics.filter(t => !state.topicMastery[t.id]);

    if (unmastered.length === 0) {
        // All topics mastered - course completed!
        return null;
    }

    // Simple heuristic: Take the first unmastered topic where prerequisites are met
    for (const topic of unmastered) {
        const confidence = state.topicConfidence[topic.id] || 0;

        // Check prerequisites
        const prereqsMet = topic.prerequisites.every(pId => state.topicMastery[pId]);

        if (prereqsMet) {
            if (confidence < ADAPTIVE_THRESHOLDS.BACKTRACK && state.topicConfidence[topic.id] !== undefined) {
                // This topic is too hard - return it for review
                return topic;
            }
            return topic;
        } else {
            // Prerequisites not met - find the first unmet prerequisite
            const unmetPrereqId = topic.prerequisites.find(pId => !state.topicMastery[pId]);
            if (unmetPrereqId) {
                return allTopics.find(t => t.id === unmetPrereqId) || null;
            }
        }
    }

    // Fallback: return first unmastered topic
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
