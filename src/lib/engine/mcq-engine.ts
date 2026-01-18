
/**
 * Phase 6: Dynamic MCQ Engine
 * Handles intelligent selection of 30 questions from a 70-question pool
 * based on student baseline and real-time performance.
 */

interface MCQ {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    difficulty: 'basic' | 'intermediate' | 'advanced';
    explanation: string;
}

interface StudentState {
    masteryTags: Record<string, string>; // From Phase 0: MASTER, MISCONCEPTION, etc.
    recentConfidence: number[];
}

export function selectDynamicMCQs(pool: MCQ[], state: StudentState, limit: number = 30): MCQ[] {
    // 1. Separate pool by difficulty
    const basic = pool.filter(q => q.difficulty === 'basic');
    const intermediate = pool.filter(q => q.difficulty === 'intermediate');
    const advanced = pool.filter(q => q.difficulty === 'advanced');

    let selected: MCQ[] = [];

    // 2. Adjust ratio based on mastery (simplified for now)
    // If student has many MISCONCEPTIONS, we prioritize basic/intermediate
    // If student has high MASTERY, we prioritize advanced

    const masteryCount = Object.values(state.masteryTags).filter(t => t === 'MASTER').length;
    const errorCount = Object.values(state.masteryTags).filter(t => t === 'MISCONCEPTION').length;

    let targetRatios = { basic: 0.3, intermediate: 0.5, advanced: 0.2 };

    if (masteryCount > errorCount) {
        targetRatios = { basic: 0.1, intermediate: 0.4, advanced: 0.5 };
    } else if (errorCount > 0) {
        targetRatios = { basic: 0.5, intermediate: 0.4, advanced: 0.1 };
    }

    // 3. Draft the selection
    const pick = (list: MCQ[], count: number) => {
        return [...list].sort(() => 0.5 - Math.random()).slice(0, count);
    };

    selected.push(...pick(basic, Math.floor(limit * targetRatios.basic)));
    selected.push(...pick(intermediate, Math.floor(limit * targetRatios.intermediate)));
    selected.push(...pick(advanced, limit - selected.length));

    return selected.sort(() => 0.5 - Math.random());
}
