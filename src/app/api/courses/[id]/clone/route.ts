
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyAuth(req);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: originalId } = await params;

        // 1. Get original course
        const courses = await dbClient.getCourses();
        const original = courses.find((c: any) => c.id === originalId);

        if (!original) {
            return NextResponse.json({ error: 'Source course not found' }, { status: 404 });
        }

        // 2. Create clone
        const cloned = await dbClient.createCourse({
            title: `${original.title} (Clone)`,
            description: original.description,
            modules: original.modules || [],
            college_id: user.collegeId,
            teacher_id: user.id,
            status: 'published'
        });

        // Copy GitHub contents (Simulation for now, usually we'd trigger a task)
        // Since we're using GitHub as storage, the clone will need its own folder.
        // We can trigger the generator lab again but with a special "clone" flag or just let it re-generate.
        // Actually, if we want the EXACT content, we should use the same master.json.

        return NextResponse.json({
            message: 'Course cloned successfully',
            courseId: cloned.id
        });

    } catch (error) {
        console.error('Clone course error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
