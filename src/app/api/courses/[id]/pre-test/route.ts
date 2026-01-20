
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

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

        // Normalization for demo vs real courses
        if (id === 'owasp-top-10' || id === 'OWASP-TOP-10') {
            return NextResponse.json({ questions: MOCK_PRE_TESTS['OWASP-TOP-10'] });
        }

        // Try to fetch from GitHub Storage for AI Course
        try {
            const GITHUB_BASE = "https://raw.githubusercontent.com/ShrE333/sovap1/main";
            const response = await fetch(`${GITHUB_BASE}/courses/${id}/master.json`);
            if (response.ok) {
                const courseData = await response.json();
                // Extract MCQs from first few modules as diagnostic
                const questions = (courseData.modules || []).slice(0, 3).flatMap((m: any) => m.mcqs || []).slice(0, 5);
                if (questions.length > 0) {
                    return NextResponse.json({ questions });
                }
            }
        } catch (e) {
            console.warn("Could not fetch diagnostic from GitHub, using fallback:", e);
        }

        // Final Fallback: Generate dynamic placeholder questions based on ID/Context
        // In a real RAG system, we'd query the vector DB here.
        const fallbackQuestions = [
            {
                id: 'diag-1',
                topicId: 'Fundamentals',
                question: `What is your current experience level with ${id.split('-')[0]}?`,
                options: ["Beginner", "Intermediate", "Professional", "Academic"],
                correctIndex: 0,
                difficulty: 'basic'
            },
            {
                id: 'diag-2',
                topicId: 'Core_Concepts',
                question: `Which of these best describes a core challenge in this field?`,
                options: ["Data Management", "Security", "Scalability", "Accuracy"],
                correctIndex: 0,
                difficulty: 'basic'
            }
        ];

        return NextResponse.json({ questions: fallbackQuestions });
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

        // Fetch original questions to verify answers
        let questions: any[] = [];
        if (id === 'owasp-top-10' || id === 'OWASP-TOP-10') {
            questions = MOCK_PRE_TESTS['OWASP-TOP-10'];
        } else {
            // Try GitHub first
            try {
                const GITHUB_BASE = "https://raw.githubusercontent.com/ShrE333/sovap-course-storage/main";
                const response = await fetch(`${GITHUB_BASE}/courses/${id}/master.json`);
                if (response.ok) {
                    const courseData = await response.json();
                    questions = (courseData.modules || []).flatMap((m: any) => m.mcqs || []);
                }
            } catch (e) { }

            // If still empty, it might be the fallback questions
            if (questions.length === 0) {
                questions = [
                    { id: 'diag-1', topicId: 'Fundamentals', correctIndex: 0 },
                    { id: 'diag-2', topicId: 'Core_Concepts', correctIndex: 0 }
                ];
            }
        }

        // Logic to calculate Cognitive Matrix
        const results = answers.map((ans: any) => {
            const original = questions.find(q => q.id === ans.questionId);
            if (!original) return null;

            const isCorrect = ans.answerIndex === original.correctIndex;
            const confidence = ans.confidence; // 1 to 5

            let tag = '';
            if (isCorrect && confidence >= 4) tag = 'MASTER';
            else if (isCorrect && confidence < 4) tag = 'GUESS';
            else if (!isCorrect && confidence >= 4) tag = 'MISCONCEPTION';
            else tag = 'UNKNOWN';

            return { topicId: original.topicId, tag, isCorrect, confidence };
        }).filter(Boolean);

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

        // Store this in Supabase learning_states
        try {
            const masteryTags = results.reduce((acc: any, curr: any) => {
                acc[curr.topicId] = curr.tag;
                return acc;
            }, {});

            await dbClient.updateLearningState(user.id, id, { masteryTags });
        } catch (dbError) {
            console.error("Failed to save learning state:", dbError);
            // Don't fail the request, just log it
        }

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
