import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { dbClient } from '@/lib/db-client';

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;

    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Mock DB enrollment
        await dbClient.enrollStudent(user.id, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Enrollment error:', error);
        return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
    }
}
