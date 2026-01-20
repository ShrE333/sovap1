import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function PATCH(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { courseId, progress, currentTopic } = await req.json();

        if (!courseId || progress === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Update enrollment in database
        const updated = await dbClient.updateEnrollment(user.id, courseId, {
            progress: progress,
            current_topic: currentTopic,
            status: progress >= 100 ? 'completed' : 'active'
        });

        return NextResponse.json({ success: true, enrollment: updated });
    } catch (error: any) {
        console.error('Update enrollment error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
