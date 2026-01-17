
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

// Mock Diagnostic Questions per Course
const MOCK_PRE_TESTS: Record<string, any[]> = {
    'OWASP-TOP-10': [
        {
            id: 'q1',
            topicId: 'XSS',
            question: "Which of the following describes a 'Reflected' XSS attack?",
            options: [
                "Malicious script is permanently stored on the server.",
                "Malicious script is delivered via a URL parameter or form input.",
                "Malicious script executes only on the student's local machine.",
                "Malicious script is disguised as a CSS file."
            ],
            correctIndex: 1,
            difficulty: 'basic'
        },
        {
            id: 'q2',
            topicId: 'Injections',
            question: "What is the primary defense against SQL Injection?",
            options: [
                "Deleting the database every 24 hours.",
                "Using Parameterized Queries (Prepared Statements).",
                "Converting all text to Uppercase.",
                "Blocking all apostrophes from user input."
            ],
            correctIndex: 1,
            difficulty: 'basic'
        },
        {
            id: 'q3',
            topicId: 'Broken_Auth',
            question: "Why should session tokens be regenerated after a successful login?",
            options: [
                "To save server memory.",
                "To prevent Session Fixation attacks.",
                "To make the URL look cleaner.",
                "To encrypt the password twice."
            ],
            correctIndex: 1,
            difficulty: 'intermediate'
        }
    ]
};

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Normalize ID for demo
        const courseRef = id.includes('OWASP') ? 'OWASP-TOP-10' : 'OWASP-TOP-10';
        const questions = MOCK_PRE_TESTS[courseRef] || [];

        return NextResponse.json({ questions });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { answers } = await req.json(); // Array of { questionId, answerIndex, confidence }

        // Logic to calculate Cognitive Matrix
        const results = answers.map((ans: any) => {
            const courseRef = id.includes('OWASP') ? 'OWASP-TOP-10' : 'OWASP-TOP-10';
            const original = MOCK_PRE_TESTS[courseRef].find(q => q.id === ans.questionId);

            const isCorrect = ans.answerIndex === original.correctIndex;
            const confidence = ans.confidence; // 1 to 5

            let tag = '';
            if (isCorrect && confidence >= 4) tag = 'MASTER';
            else if (isCorrect && confidence < 4) tag = 'GUESS';
            else if (!isCorrect && confidence >= 4) tag = 'MISCONCEPTION';
            else tag = 'UNKNOWN';

            return { topicId: original.topicId, tag, isCorrect, confidence };
        });

        // Generate Roadmap based on results
        const roadmap = results.map((res: any) => {
            let action = 'standard';
            let reason = '';

            if (res.tag === 'MASTER') {
                action = 'fast-track';
                reason = `High mastery detected in ${res.topicId}. Content will be accelerated.`;
            } else if (res.tag === 'MISCONCEPTION') {
                action = 'deep-dive';
                reason = `Critical misconception in ${res.topicId}. Unlearning module required.`;
            } else if (res.tag === 'GUESS') {
                action = 'reinforce';
                reason = `Foundational knowledge in ${res.topicId} is shaky. Extra examples provided.`;
            }

            return { topicId: res.topicId, action, reason };
        });

        // Store this in Supabase learning_states (Simulated for now)
        // In real app: dbClient.saveLearningState(...)

        return NextResponse.json({
            message: 'Adaptive Roadmap Created!',
            roadmap,
            results
        });

    } catch (error) {
        console.error('Pre-test submission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
